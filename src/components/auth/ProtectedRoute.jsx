import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    // Afficher un loader pendant la vérification de l'authentification
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner 
          size="xl" 
          text="Vérification de l'authentification..." 
          className="text-center"
        />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Rediriger vers la page de connexion en gardant l'URL de destination
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  
  return children;
};

export default ProtectedRoute;
