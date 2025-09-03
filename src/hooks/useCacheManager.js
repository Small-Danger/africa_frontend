import { useCallback } from 'react';

const useCacheManager = () => {
  // Configuration du cache
  const CACHE_KEYS = {
    BANNERS: 'bs_shop_banners_cache',
    HOME_DATA: 'bs_shop_home_cache',
    CATEGORIES: 'bs_shop_categories_cache',
    PRODUCTS: 'bs_shop_products_cache'
  };

  const CACHE_TTL = {
    BANNERS: 5 * 60 * 1000, // 5 minutes
    HOME_DATA: 2 * 60 * 60 * 1000, // 2 heures
    CATEGORIES: 30 * 60 * 1000, // 30 minutes
    PRODUCTS: 15 * 60 * 1000 // 15 minutes
  };

  // Nettoyer le cache expiré
  const cleanupExpiredCache = useCallback(() => {
    try {
      Object.entries(CACHE_KEYS).forEach(([key, cacheKey]) => {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { timestamp } = JSON.parse(cached);
            const ttl = CACHE_TTL[key];
            if (Date.now() - timestamp > ttl) {
              localStorage.removeItem(cacheKey);
              console.log(`🗑️ Cache expiré supprimé: ${key}`);
            }
          } catch (error) {
            // Supprimer les entrées corrompues
            localStorage.removeItem(cacheKey);
            console.warn(`⚠️ Cache corrompu supprimé: ${key}`);
          }
        }
      });
    } catch (error) {
      console.warn('Erreur lors du nettoyage du cache:', error);
    }
  }, []);

  // Vérifier si le cache est valide
  const isCacheValid = useCallback((cacheKey, ttl) => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        return Date.now() - timestamp < ttl;
      }
    } catch (error) {
      console.warn('Erreur lors de la vérification du cache:', error);
    }
    return false;
  }, []);

  // Récupérer les données du cache
  const getCachedData = useCallback((cacheKey) => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        return { data, timestamp, isValid: true };
      }
    } catch (error) {
      console.warn('Erreur lors de la lecture du cache:', error);
      localStorage.removeItem(cacheKey);
    }
    return { data: null, timestamp: null, isValid: false };
  }, []);

  // Sauvegarder les données dans le cache
  const setCachedData = useCallback((cacheKey, data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 Données sauvegardées dans le cache: ${cacheKey}`);
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde du cache:', error);
    }
  }, []);

  // Vider tout le cache
  const clearAllCache = useCallback(() => {
    try {
      Object.values(CACHE_KEYS).forEach(cacheKey => {
        localStorage.removeItem(cacheKey);
      });
      console.log('🧹 Tout le cache a été vidé');
    } catch (error) {
      console.warn('Erreur lors du vidage du cache:', error);
    }
  }, []);

  // Vider un cache spécifique
  const clearCache = useCallback((cacheKey) => {
    try {
      localStorage.removeItem(cacheKey);
      console.log(`🗑️ Cache vidé: ${cacheKey}`);
    } catch (error) {
      console.warn('Erreur lors du vidage du cache:', error);
    }
  }, []);

  // Obtenir les statistiques du cache
  const getCacheStats = useCallback(() => {
    const stats = {};
    try {
      Object.entries(CACHE_KEYS).forEach(([key, cacheKey]) => {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;
            const ttl = CACHE_TTL[key];
            stats[key] = {
              exists: true,
              age: Math.round(age / 1000), // en secondes
              ttl: Math.round(ttl / 1000), // en secondes
              isValid: age < ttl,
              expiresIn: Math.round((ttl - age) / 1000) // en secondes
            };
          } catch (error) {
            stats[key] = { exists: true, corrupted: true };
          }
        } else {
          stats[key] = { exists: false };
        }
      });
    } catch (error) {
      console.warn('Erreur lors de la récupération des stats du cache:', error);
    }
    return stats;
  }, []);

  return {
    CACHE_KEYS,
    CACHE_TTL,
    cleanupExpiredCache,
    isCacheValid,
    getCachedData,
    setCachedData,
    clearAllCache,
    clearCache,
    getCacheStats
  };
};

export default useCacheManager;
