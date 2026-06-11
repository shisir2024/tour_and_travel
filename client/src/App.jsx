import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { lazy, Suspense } from 'react';
import './App.css';

const Home           = lazy(() => import('./pages/Home'));
const About          = lazy(() => import('./pages/About'));
const Faq            = lazy(() => import('./pages/Faq'));
const Contact        = lazy(() => import('./pages/Contact'));
const Privacy        = lazy(() => import('./pages/Privacy'));
const BookingForm    = lazy(() => import('./pages/BookingForm'));
const Login          = lazy(() => import('./pages/Login'));
const Signup         = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Milestones     = lazy(() => import('./pages/Milestones'));
const MyBookings     = lazy(() => import('./pages/MyBookings'));
const StaffDashboard = lazy(() => import('./pages/StaffDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Tours          = lazy(() => import('./pages/Tours'));
const Customers      = lazy(() => import('./pages/Customers'));
const Bookings       = lazy(() => import('./pages/Bookings'));
const Notifications  = lazy(() => import('./pages/Notifications'));

function Protected({ children, allowedRoles }) {
  const { isAuth, userRole } = useAuth();

  if (!isAuth) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (userRole === 'staff') return <Navigate to="/staff-dashboard" replace />;
    return <Navigate to="/home" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '16px' }}>Loading...</div>}>
    <Routes>
      <Route path="/"       element={<Navigate to="/login" replace />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login"  element={<Login />} />
      <Route path="/forgot" element={<ForgotPassword />} />

      {/* Client routes */}
      <Route path="/home"        element={<Protected allowedRoles={['client']}><Home /></Protected>} />
      <Route path="/about"       element={<Protected allowedRoles={['client']}><About /></Protected>} />
      <Route path="/faq"         element={<Protected allowedRoles={['client']}><Faq /></Protected>} />
      <Route path="/contact"     element={<Protected allowedRoles={['client']}><Contact /></Protected>} />
      <Route path="/privacy"     element={<Protected allowedRoles={['client']}><Privacy /></Protected>} />
      <Route path="/booking"     element={<Protected allowedRoles={['client']}><BookingForm /></Protected>} />
      <Route path="/milestones"  element={<Protected allowedRoles={['client']}><Milestones /></Protected>} />
      <Route path="/my-bookings" element={<Protected allowedRoles={['client']}><MyBookings /></Protected>} />

      {/* Staff routes */}
      <Route path="/staff-dashboard" element={<Protected allowedRoles={['staff']}><StaffDashboard /></Protected>} />
      <Route path="/tours"           element={<Protected allowedRoles={['staff', 'admin']}><Tours /></Protected>} />
      <Route path="/customers"       element={<Protected allowedRoles={['staff', 'admin']}><Customers /></Protected>} />
      <Route path="/bookings"        element={<Protected allowedRoles={['staff', 'admin']}><Bookings /></Protected>} />
      <Route path="/notifications"   element={<Protected allowedRoles={['staff', 'client', 'admin']}><Notifications /></Protected>} />

      {/* Admin routes */}
      <Route path="/admin-dashboard" element={<Protected allowedRoles={['admin']}><AdminDashboard /></Protected>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
