import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f9fafb' }}>
        <div style={{ fontFamily: 'sans-serif', fontSize: '14px', color: '#6b7280' }}>Memverifikasi Sesi Auth...</div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role || 'sales';

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    if (userRole === 'admin' || userRole === 'superadmin') {
      return <Navigate to="/admin/workspace" replace />;
    } else if (userRole === 'owner') {
      return <Navigate to="/owner-portal/dashboard" replace />;
    } else if (userRole === 'finance') {
      return <Navigate to="/finance/dashboard" replace />;
    } else {
      return <Navigate to="/sales/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
