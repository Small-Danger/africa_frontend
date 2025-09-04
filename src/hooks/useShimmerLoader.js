import { useState, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer l'état de chargement avec ShimmerText
 * @param {Object} options - Options de configuration
 * @param {string} options.defaultText - Texte par défaut à afficher
 * @param {string} options.defaultSubtitle - Sous-titre par défaut
 * @param {number} options.defaultDelay - Délai par défaut en ms
 * @returns {Object} - État et fonctions de contrôle
 */
export const useShimmerLoader = (options = {}) => {
  const {
    defaultText = "AfrikRaga",
    defaultSubtitle = "Chargement...",
    defaultDelay = 1000
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState(defaultText);
  const [subtitle, setSubtitle] = useState(defaultSubtitle);

  /**
   * Démarrer le chargement
   * @param {Object} config - Configuration du chargement
   * @param {string} config.text - Texte à afficher
   * @param {string} config.subtitle - Sous-titre à afficher
   * @param {number} config.delay - Délai avant d'arrêter le chargement
   */
  const startLoading = useCallback((config = {}) => {
    const {
      text: newText = defaultText,
      subtitle: newSubtitle = defaultSubtitle,
      delay = defaultDelay
    } = config;

    setText(newText);
    setSubtitle(newSubtitle);
    setIsLoading(true);

    // Arrêter automatiquement après le délai spécifié
    if (delay > 0) {
      setTimeout(() => {
        setIsLoading(false);
      }, delay);
    }
  }, [defaultText, defaultSubtitle, defaultDelay]);

  /**
   * Arrêter le chargement
   */
  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  /**
   * Basculer l'état de chargement
   */
  const toggleLoading = useCallback(() => {
    setIsLoading(prev => !prev);
  }, []);

  /**
   * Mettre à jour le texte pendant le chargement
   * @param {string} newText - Nouveau texte
   * @param {string} newSubtitle - Nouveau sous-titre
   */
  const updateText = useCallback((newText, newSubtitle) => {
    setText(newText);
    if (newSubtitle !== undefined) {
      setSubtitle(newSubtitle);
    }
  }, []);

  return {
    isLoading,
    text,
    subtitle,
    startLoading,
    stopLoading,
    toggleLoading,
    updateText
  };
};

/**
 * Hook pour les chargements asynchrones avec ShimmerText
 * @param {Function} asyncFunction - Fonction asynchrone à exécuter
 * @param {Object} options - Options de configuration
 * @returns {Object} - État et fonctions de contrôle
 */
export const useAsyncShimmerLoader = (asyncFunction, options = {}) => {
  const {
    defaultText = "AfrikRaga",
    defaultSubtitle = "Chargement...",
    autoStart = false
  } = options;

  const shimmerLoader = useShimmerLoader({
    defaultText,
    defaultSubtitle,
    defaultDelay: 0 // Pas de délai automatique
  });

  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  /**
   * Exécuter la fonction asynchrone avec le loader
   * @param {Array} args - Arguments à passer à la fonction
   */
  const execute = useCallback(async (...args) => {
    try {
      setError(null);
      shimmerLoader.startLoading();
      
      const result = await asyncFunction(...args);
      setData(result);
      
      shimmerLoader.stopLoading();
      return result;
    } catch (err) {
      setError(err);
      shimmerLoader.stopLoading();
      throw err;
    }
  }, [asyncFunction, shimmerLoader]);

  // Démarrer automatiquement si demandé
  React.useEffect(() => {
    if (autoStart) {
      execute();
    }
  }, [autoStart, execute]);

  return {
    ...shimmerLoader,
    execute,
    error,
    data
  };
};

export default useShimmerLoader;
