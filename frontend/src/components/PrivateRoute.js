import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAuthUser, isAuthenticated } from '../utils/auth';

function PrivateRoute({ children, allowedRoles }) {
  const location = useLocation();
  const user = getAuthUser();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles?.length && (!user || !allowedRoles.includes(user.role))) {
    const fallbackPath = ['admin', 'gestor'].includes(user?.role) ? '/dashboard' : '/minha-area';
    return <Navigate to={fallbackPath} replace />;
  }

  return children || <Outlet />;
}

export default PrivateRoute;
