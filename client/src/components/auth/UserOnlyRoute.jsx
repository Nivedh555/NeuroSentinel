import { Navigate } from 'react-router-dom';

const UserOnlyRoute = ({ children }) => {
  const role = localStorage.getItem('appRole');
  const roleChoiceDone = localStorage.getItem('roleChoiceDone') === 'true';

  if (!roleChoiceDone) {
    return <Navigate to="/" replace />;
  }

  if (role !== 'user') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default UserOnlyRoute;