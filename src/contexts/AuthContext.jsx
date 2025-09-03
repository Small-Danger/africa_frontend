import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier l'authentification au chargement de l'application
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      // Si pas de token, pas besoin de vérifier l'authentification
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await authService.getProfile();
        if (response.success) {
          setIsAuthenticated(true);
          setUser(response.data.user);
        } else {
          // Token invalide, le supprimer
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.log('Utilisateur non authentifié ou token expiré');
        // Nettoyer les données d'authentification invalides
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      if (response.success) {
        // Mettre à jour l'état
        setIsAuthenticated(true);
        setUser(response.data.user);
      }
      
      return response;
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Erreur de connexion' 
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  // Fonction utilitaire pour vérifier le rôle
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isClient = () => {
    return user && user.role === 'client';
  };

  const value = {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    isAdmin,
    isClient
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
