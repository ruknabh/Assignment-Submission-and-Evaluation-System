import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

// Blocks access if:
// 1. User is not logged in → redirect to /login
// 2. User does not have the required role → redirect to their own dashboard
const ProtectedRoute = ({ children, role }) => {
  const { user, loading, getDashboardPath } = useAuth();

  // Still checking localStorage on first load — show nothing
  if (loading) return null;

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role — send them to their correct dashboard
  if (role && user.role !== role) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;