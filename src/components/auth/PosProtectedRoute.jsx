import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const PosProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Chargement caisse..." className="text-white" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  const canAccessPos = user?.role === 'admin' || user?.role === 'caissiere';

  if (!canAccessPos) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PosProtectedRoute;
