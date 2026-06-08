import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

import Home           from './pages/Home';
import About          from './pages/About';
import Faq            from './pages/Faq';
import Contact        from './pages/Contact';
import Privacy        from './pages/Privacy';
import BookingForm    from './pages/BookingForm';
import Login          from './pages/Login';
import Signup         from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Milestones     from './pages/Milestones';
import MyBookings     from './pages/MyBookings';

import StaffDashboard  from './pages/StaffDashboard';
import AdminDashboard  from './pages/AdminDashboard';
import Tours           from './pages/Tours';
import Customers       from './pages/Customers';
import Bookings        from './pages/Bookings';
import Notifications   from './pages/Notifications';

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
