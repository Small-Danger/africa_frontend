import { useState, useEffect } from 'react';
import { statsService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

export const useDashboard = () => {
  const [stats, setStats] = useState({
    overview: {
      total_users: 0,
      total_products: 0,
      total_categories: 0,
      total_orders: 0,
    },
    sales: {
      monthly_sales: 0,
      monthly_orders: 0,
      daily_sales: [],
    },
    recent_orders: [],
    top_products: [],
    order_statuses: [],
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showError, showSuccess } = useNotification();

  // Charger les statistiques du dashboard
  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await statsService.getDashboardStats();
      
      if (response.success) {
        setStats(response.data);
        showSuccess('Statistiques chargées avec succès');
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des statistiques');
      }
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors du chargement des statistiques';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les statistiques des ventes
  const loadSalesStats = async (period = 'month') => {
    try {
      const response = await statsService.getSalesStats(period);
      
      if (response.success) {
        setStats(prev => ({
          ...prev,
          sales: {
            ...prev.sales,
            ...response.data,
          },
        }));
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des statistiques de ventes');
      }
    } catch (err) {
      showError(err.message || 'Erreur lors du chargement des statistiques de ventes');
    }
  };

  // Charger les statistiques des produits
  const loadProductStats = async () => {
    try {
      const response = await statsService.getProductStats();
      
      if (response.success) {
        setStats(prev => ({
          ...prev,
          product_stats: response.data,
        }));
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des statistiques des produits');
      }
    } catch (err) {
      showError(err.message || 'Erreur lors du chargement des statistiques des produits');
    }
  };

  // Rafraîchir toutes les statistiques
  const refreshStats = async () => {
    await Promise.all([
      loadDashboardStats(),
      loadSalesStats(),
      loadProductStats(),
    ]);
  };

  // Charger les données au montage du composant
  useEffect(() => {
    loadDashboardStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    loadDashboardStats,
    loadSalesStats,
    loadProductStats,
    refreshStats,
  };
};

export default useDashboard;
