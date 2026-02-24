// in App.js (or a separate file)
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './Authentication';

export const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user} = useAuth();

  if (!isAuthenticated) {
    // not logged in → go to login
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // logged in, but role not permitted
    return <Navigate to="/unauthorized" replace />;
  }

  // OK
  return children;
};
