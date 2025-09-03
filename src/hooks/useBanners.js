import { useState, useEffect, useCallback } from 'react';

const useBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configuration de l'API
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.11.180:8000/api';
  
  // Configuration du cache
  const CACHE_KEY = 'bs_shop_banners_cache';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Récupérer les bannières depuis le cache
  const getCachedBanners = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          console.log('📦 Bannières récupérées depuis le cache');
          return data;
        } else {
          // Cache expiré, le supprimer
          localStorage.removeItem(CACHE_KEY);
          console.log('⏰ Cache des bannières expiré, suppression');
        }
      }
    } catch (error) {
      console.warn('Erreur lors de la lecture du cache des bannières:', error);
      localStorage.removeItem(CACHE_KEY);
    }
    return null;
  }, []);

  // Sauvegarder les bannières dans le cache
  const setCachedBanners = useCallback((bannersData) => {
    try {
      const cacheData = {
        data: bannersData,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log('💾 Bannières sauvegardées dans le cache');
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde du cache des bannières:', error);
    }
  }, []);

  // Récupérer les bannières actives
  const fetchBanners = useCallback(async (forceRefresh = false) => {
    try {
      // Vérifier le cache d'abord (sauf si force refresh)
      if (!forceRefresh) {
        const cachedBanners = getCachedBanners();
        if (cachedBanners) {
          setBanners(cachedBanners);
          setLoading(false);
          setError(null);
          return cachedBanners;
        }
      }

      setLoading(true);
      setError(null);
      
      console.log('🌐 Récupération des bannières depuis l\'API...');
      
      const response = await fetch(`${API_BASE_URL}/banners`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Réponse bannières:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Données bannières reçues:', data);
        
        if (data.success && data.data) {
          // Trier les bannières par position
          const sortedBanners = data.data.sort((a, b) => a.position - b.position);
          setBanners(sortedBanners);
          
          // Sauvegarder dans le cache
          setCachedBanners(sortedBanners);
          
          console.log('✅ Bannières chargées et mises en cache:', sortedBanners.length);
          return sortedBanners;
        } else {
          setBanners([]);
          setCachedBanners([]);
          console.log('ℹ️ Aucune bannière active trouvée');
          return [];
        }
      } else {
        const errorData = await response.text();
        console.error('Erreur bannières:', errorData);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des bannières:', err);
      setError(err.message);
      setBanners([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getCachedBanners, setCachedBanners]);

  // Charger les bannières au montage du composant
  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Fonction pour forcer le rafraîchissement
  const refreshBanners = useCallback(() => {
    return fetchBanners(true);
  }, [fetchBanners]);

  return {
    banners,
    loading,
    error,
    refetch: fetchBanners,
    refresh: refreshBanners
  };
};

export default useBanners;
