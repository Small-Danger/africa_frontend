import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'afrikraga_favorites';
const EVENT_NAME = 'afrikraga-favorites-changed';

const readFavorites = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(Number).filter(Boolean) : [];
  } catch {
    return [];
  }
};

const writeFavorites = (ids) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState(readFavorites);

  useEffect(() => {
    const sync = () => setFavorites(readFavorites());
    window.addEventListener(EVENT_NAME, sync);
    return () => window.removeEventListener(EVENT_NAME, sync);
  }, []);

  const isFavorite = useCallback(
    (productId) => favorites.includes(Number(productId)),
    [favorites]
  );

  const toggleFavorite = useCallback((productId) => {
    const id = Number(productId);
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeFavorites(next);
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite };
};

export default useFavorites;
