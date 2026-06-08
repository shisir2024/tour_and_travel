import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuth, userRole } = useAuth();

  if (!isAuth) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 'admin')  return <Navigate to="/admin-dashboard" />;
    if (userRole === 'staff')  return <Navigate to="/staff-dashboard" />;
    return <Navigate to="/home" />;
  }

  return children;
}
