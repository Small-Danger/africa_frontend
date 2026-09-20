import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import { canAccessBackoffice, hasAnyPermission, homePathForUser } from '../../utils/staffAuth';

const AdminProtectedRoute = ({ children, permission }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <LoadingSpinner size="xl" text="Vérification des droits..." className="text-center" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!canAccessBackoffice(user)) {
    return <Navigate to={homePathForUser(user)} replace />;
  }

  const required = Array.isArray(permission) ? permission : permission ? [permission] : [];
  if (required.length > 0 && !hasAnyPermission(user, required)) {
    return <Navigate to={homePathForUser(user)} replace />;
  }

  return children;
};

export default AdminProtectedRoute;
