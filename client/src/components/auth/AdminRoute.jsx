import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children, allowWithoutAdminSession = false }) => {
  const role = localStorage.getItem('appRole');
  const roleChoiceDone = localStorage.getItem('roleChoiceDone') === 'true';
  const isAdminLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';

  if (!roleChoiceDone) {
    return <Navigate to="/" replace />;
  }

  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (!allowWithoutAdminSession && !isAdminLoggedIn) {
    return <Navigate to="/doctor-login" replace />;
  }

  return children;
};

export default AdminRoute;