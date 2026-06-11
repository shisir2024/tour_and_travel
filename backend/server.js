const express   = require('express');
const http      = require('http');
const path      = require('path');
const { Server } = require('socket.io');
const mongoose  = require('mongoose');
const cors      = require('cors');
const compression = require('compression');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app    = express();
const server = http.createServer(app);

app.use(compression());

// Build allowed origins from env — comma-separated list supported
// e.g. CLIENT_URL=https://tourandtravel-theta.vercel.app,http://localhost:5173
const rawOrigins = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = rawOrigins
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.set('trust proxy', 1); // Trust the first proxy (Render/Vercel)

const io     = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET','POST'] }
});

app.use(express.json());
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Attach io to every request so controllers can emit
app.use((req, res, next) => { req.io = io; next(); });

if (!process.env.MONGO_URL) {
  console.error('❌ FATAL ERROR: MONGO_URL is not defined in environment variables.');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.log('MongoDB connection failed:', err.message));

// Socket.IO connection
io.on('connection', socket => {
  socket.on('join-room', room => {
    socket.join(room); // 'client', 'staff', or 'user-{id}'
  });
  socket.on('disconnect', () => {});
});

// Routes
app.get('/health', (req, res) => res.status(200).send('OK')); // Health check for Render

app.use('/api/user',          require('./routers/UserRoutes'));
app.use('/api/admin',         require('./routers/AdminRoutes'));
app.use('/api/tours',         require('./routers/TourRoutes'));
app.use('/api/customers',     require('./routers/CustomerRoutes'));
app.use('/api/bookings',      require('./routers/BookingRoutes'));
app.use('/api/notifications', require('./routers/NotificationRoutes'));
app.use('/api/stats',         require('./routers/StatsRoutes'));
app.use('/api/contact',       require('./routers/ContactRoutes'));
app.use('/api/newsletter',    require('./routers/NewsletterRoutes'));
app.use('/api/privacy',       require('./routers/PrivacyRoutes'));

// Static Files - Serve with caching for better performance
const buildPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(buildPath, { maxAge: '1d' }));

// The "Optimal" Express 5 SPA Fallback using Regex
// This catches all GET requests that are NOT API calls or health checks
app.get(/^(?!\/(api|health)).*$/, (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send("Frontend build not found. If you are using Vercel for frontend, use the Vercel URL instead.");
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);

  // Keep Render free tier alive — ping every 10 minutes
  if (process.env.RENDER_EXTERNAL_URL) {
    setInterval(() => {
      fetch(`${process.env.RENDER_EXTERNAL_URL}/health`)
        .catch(() => {});
    }, 10 * 60 * 1000);
  }
});
