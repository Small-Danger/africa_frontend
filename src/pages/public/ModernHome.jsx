import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Grid,
  Clock,
  List,
  Play,
  Pause,
  ShoppingCart,
  Heart
} from 'lucide-react';
import { categoryService, productService } from '../../services/api';
import ProductCard from '../../components/ProductCard';
import SimpleBannerCarousel from '../../components/SimpleBannerCarousel';
import useBanners from '../../hooks/useBanners';

const ModernHome = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentCategorySlide, setCurrentCategorySlide] = useState(0);
  const [currentProductSlide, setCurrentProductSlide] = useState(0);
  const [categories, setCategories] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('unknown');
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  
  const autoPlayRef = useRef(null);
  const productAutoPlayRef = useRef(null);
  const categoryAutoPlayRef = useRef(null);
  const navigate = useNavigate();
  
  // Hook pour récupérer les bannières
  const { banners, loading: bannersLoading, error: bannersError, refresh: refreshBanners } = useBanners();
  
  // Cache pour éviter les requêtes redondantes
  const dataCacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);
  
  // Cache persistant de session
  const SESSION_CACHE_KEY = 'bs_shop_home_cache';
  const SESSION_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 heures
  
  // Nettoyer le cache expiré au chargement
  useEffect(() => {
    const cleanupExpiredCache = () => {
      try {
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
          if (key.startsWith('bs_shop_')) {
            try {
              const cached = sessionStorage.getItem(key);
              if (cached) {
                const { timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp > SESSION_CACHE_TTL) {
                  sessionStorage.removeItem(key);
                }
              }
            } catch (error) {
              // Supprimer les entrées corrompues
              sessionStorage.removeItem(key);
            }
          }
        });
      } catch (error) {
        console.warn('Erreur lors du nettoyage du cache:', error);
      }
    };
    
    cleanupExpiredCache();
  }, []);

  // Test de connexion API
  const testApiConnection = useCallback(async () => {
    try {
      setApiStatus('testing');
              // Utiliser l'IP locale pour le test sur téléphone
        const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.11.180:8000/api';
      const response = await fetch(`${apiUrl}/test`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API connectée:', data);
        setApiStatus('connected');
        return true;
      } else {
        console.error('❌ API erreur HTTP:', response.status);
        setApiStatus('error');
        return false;
      }
    } catch (err) {
      console.error('❌ Erreur de connexion API:', err);
      setApiStatus('error');
      return false;
    }
  }, []);

  // Charger les données depuis l'API avec cache
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // Vérifier le cache de session d'abord
      try {
        const sessionCached = sessionStorage.getItem(SESSION_CACHE_KEY);
        if (sessionCached) {
          const { data, timestamp } = JSON.parse(sessionCached);
          if (Date.now() - timestamp < SESSION_CACHE_TTL) {
            setCategories(data.categories);
            setAllProducts(data.products);
            setPopularProducts(data.popularProducts);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.warn('Erreur lors de la lecture du cache de session:', error);
      }

      // Vérifier le cache mémoire
      const cacheKey = 'home_data';
      const cached = dataCacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 3 * 60 * 1000) { // 3 minutes
        setCategories(cached.data.categories);
        setAllProducts(cached.data.products);
        setPopularProducts(cached.data.popularProducts);
        setLoading(false);
        return;
      }

      // Annuler la requête précédente
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);
        
        // Tester d'abord la connexion API
        const isConnected = await testApiConnection();
        if (!isConnected) {
          if (isMounted) {
            setError('Impossible de se connecter à l\'API. Vérifiez que le backend est démarré sur http://192.168.11.180:8000');
            setLoading(false);
          }
          return;
        }
        
        // Charger les catégories et produits en parallèle
        const [categoriesRes, productsRes] = await Promise.all([
          categoryService.getCategories(),
          productService.getProducts({ per_page: 50, sort_by: 'created_at', sort_order: 'desc' })
        ]);
        
        if (!isMounted) return;
        
        if (categoriesRes.success) {
          const categoriesData = categoriesRes.data.categories || [];
          setCategories(categoriesData);
        } else {
          console.error('❌ Erreur catégories:', categoriesRes);
          setError('Erreur lors du chargement des catégories: ' + (categoriesRes.message || 'Erreur inconnue'));
        }
        
        if (productsRes.success) {
          const products = productsRes.data.products || [];
          setAllProducts(products);
          
          // Filtrer les produits populaires (ceux avec un rating élevé)
          const popular = products
            .filter(product => (product.rating || 0) >= 4.0)
            .slice(0, 8);
          setPopularProducts(popular);
          
          // Mettre en cache de session
          try {
            const sessionData = {
              data: {
                categories: categoriesRes.success ? categoriesRes.data.categories || [] : [],
                products,
                popularProducts: popular
              },
              timestamp: Date.now()
            };
            sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(sessionData));
          } catch (error) {
            console.warn('Erreur lors de la sauvegarde du cache de session:', error);
          }

          // Mettre en cache mémoire
          dataCacheRef.current.set(cacheKey, {
            data: {
              categories: categoriesRes.success ? categoriesRes.data.categories || [] : [],
              products,
              popularProducts: popular
            },
            timestamp: Date.now()
          });
        } else {
          console.error('❌ Erreur produits:', productsRes);
          setError('Erreur lors du chargement des produits: ' + (productsRes.message || 'Erreur inconnue'));
        }
      } catch (err) {
        if (err.name !== 'AbortError' && isMounted) {
          console.error('❌ Erreur lors du chargement des données:', err);
          setError('Erreur lors du chargement des données: ' + err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadData();

    return () => {
      isMounted = false;
    };
  }, [testApiConnection]);

  // Nettoyer les timers au démontage
  useEffect(() => {
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
      if (productAutoPlayRef.current) {
        clearInterval(productAutoPlayRef.current);
      }
      if (categoryAutoPlayRef.current) {
        clearInterval(categoryAutoPlayRef.current);
      }
    };
  }, []);

  // Auto-play du carrousel des produits populaires
  useEffect(() => {
    if (popularProducts.length === 0 || !isAutoPlaying) {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
      return;
    }
    
    autoPlayRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(popularProducts.length / 2));
    }, 3000);
    
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, [popularProducts.length, isAutoPlaying]);

  // Auto-play du carrousel de tous les produits
  useEffect(() => {
    if (allProducts.length === 0 || !isAutoPlaying) {
      if (productAutoPlayRef.current) {
        clearInterval(productAutoPlayRef.current);
        productAutoPlayRef.current = null;
      }
      return;
    }
    
    productAutoPlayRef.current = setInterval(() => {
      setCurrentProductSlide((prev) => (prev + 1) % Math.ceil(allProducts.length / 2));
    }, 2500);
    
    return () => {
      if (productAutoPlayRef.current) {
        clearInterval(productAutoPlayRef.current);
        productAutoPlayRef.current = null;
      }
    };
  }, [allProducts.length, isAutoPlaying]);

  // Auto-play du carrousel des catégories
  useEffect(() => {
    if (categories.length === 0) {
      if (categoryAutoPlayRef.current) {
        clearInterval(categoryAutoPlayRef.current);
        categoryAutoPlayRef.current = null;
      }
      return;
    }
    
    categoryAutoPlayRef.current = setInterval(() => {
      setCurrentCategorySlide((prev) => (prev + 1) % Math.ceil(categories.length / 2));
    }, 4000);
    
    return () => {
      if (categoryAutoPlayRef.current) {
        clearInterval(categoryAutoPlayRef.current);
        categoryAutoPlayRef.current = null;
      }
    };
  }, [categories.length]);

  const nextSlide = useCallback(() => {
    if (popularProducts.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(popularProducts.length / 2));
  }, [popularProducts.length]);

  const prevSlide = useCallback(() => {
    if (popularProducts.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(popularProducts.length / 2)) % Math.ceil(popularProducts.length / 2));
  }, [popularProducts.length]);

  const nextProductSlide = useCallback(() => {
    if (allProducts.length === 0) return;
    setCurrentProductSlide((prev) => (prev + 1) % Math.ceil(allProducts.length / 2));
  }, [allProducts.length]);

  const prevProductSlide = useCallback(() => {
    if (allProducts.length === 0) return;
    setCurrentProductSlide((prev) => (prev - 1 + Math.ceil(allProducts.length / 2)) % Math.ceil(allProducts.length / 2));
  }, [allProducts.length]);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => !prev);
  }, []);

  // Fonction pour rafraîchir toutes les données (y compris les bannières)
  const refreshAllData = useCallback(async () => {
    try {
      // Rafraîchir les bannières
      await refreshBanners();
      
      // Nettoyer le cache de session pour forcer le rechargement
      sessionStorage.removeItem(SESSION_CACHE_KEY);
      dataCacheRef.current.clear();
      
      // Recharger les données
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    }
  }, [refreshBanners]);

  // Affichage du chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 border-3 border-gray-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-3 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 mt-4 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section Moderne - Réorganisé */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Section Texte Hero - Optimisée pour mobile */}
        <div className="px-4 py-6 md:py-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge Maroc - Plus compact sur mobile */}
            <div className="mb-3 md:mb-4">
              <div className="inline-flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 md:px-4 md:py-2 mb-3 md:mb-4 shadow-sm border border-white/20">
                <span className="text-base md:text-lg">🇲🇦</span>
                <span className="text-xs md:text-sm font-medium text-gray-800">Produits Authentiques du Maroc</span>
              </div>
            </div>
            
            {/* Titre Principal - Taille optimisée mobile */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4 leading-tight px-2">
              🛍️ PARFUMS & COSMÉTIQUES NATURELS
            </h1>
            
            {/* Description - Plus compacte sur mobile */}
            <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto px-2">
              Découvrez notre collection exclusive d'<strong className="text-gray-800">huiles essentielles</strong>, <strong className="text-gray-800">savons artisanaux</strong> et <strong className="text-gray-800">parfums authentiques</strong>
            </p>
          </div>
        </div>

        {/* Section Bannières - Directement après le texte */}
        {banners && banners.length > 0 && (
          <div className="px-4 pb-4 md:pb-6">
            <div className="max-w-6xl mx-auto">
              {/* Carrousel de bannières - Hauteur optimisée mobile */}
              <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="h-40 sm:h-48 md:h-64 lg:h-80">
                  <SimpleBannerCarousel 
                    banners={banners} 
                    autoPlay={true} 
                    interval={5000}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA Principal - Après les bannières */}
        <div className="px-4 pb-6 md:pb-8">
          <div className="text-center">
            <Link 
              to="/catalog" 
              className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-2xl font-semibold text-base md:text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🌟 Découvrir nos produits
            </Link>
          </div>
        </div>
      </div>

      {/* Sections de catégories en carrousel */}
      {categories.length > 0 && (
        <div className="px-4 py-4 md:py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Catégories</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentCategorySlide((prev) => (prev - 1 + Math.ceil(categories.length / 2)) % Math.ceil(categories.length / 2))}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft size={16} className="text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentCategorySlide((prev) => (prev + 1) % Math.ceil(categories.length / 2))}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg">
            <div className="flex transition-transform duration-500 ease-in-out">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className="w-1/2 flex-shrink-0 px-2 py-4"
                  style={{ transform: `translateX(-${currentCategorySlide * 100}%)` }}
                >
                  <Link to={`/catalog/${category.slug}`} className="group block">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                      <div className="relative h-32 overflow-hidden">
                        <img
                          src={category.image_main || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop'}
                          alt={category.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-2">{category.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{category.description}</p>
                        {category.subcategories && category.subcategories.length > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-blue-600 font-medium">
                              {category.subcategories.length} sous-catégorie{category.subcategories.length > 1 ? 's' : ''}
                            </span>
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Indicateurs de slide pour les catégories */}
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: Math.ceil(categories.length / 2) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentCategorySlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentCategorySlide ? 'bg-blue-600 scale-125' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Carrousel de produits populaires - Style amélioré */}
      {popularProducts.length > 0 && (
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Produits Populaires</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleAutoPlay}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {isAutoPlaying ? <Pause size={16} className="text-gray-600" /> : <Play size={16} className="text-gray-600" />}
              </button>
              <button
                onClick={prevSlide}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft size={16} className="text-gray-600" />
              </button>
              <button
                onClick={nextSlide}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg">
            <div className="flex transition-transform duration-500 ease-in-out">
              {popularProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="w-1/2 flex-shrink-0 px-2 py-4"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  <ProductCard product={product} showActions={true} />
                </div>
              ))}
            </div>
          </div>

          {/* Indicateurs de slide pour les produits populaires */}
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: Math.ceil(popularProducts.length / 2) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentSlide ? 'bg-yellow-600 scale-125' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Carrousel automatique de tous les produits - Style amélioré */}
      {allProducts.length > 0 && (
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Nouveautés</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={prevProductSlide}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft size={16} className="text-gray-600" />
              </button>
              <button
                onClick={nextProductSlide}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg">
            <div className="flex transition-transform duration-500 ease-in-out">
              {allProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="w-1/2 flex-shrink-0 px-2 py-4"
                  style={{ transform: `translateX(-${currentProductSlide * 100}%)` }}
                >
                  <ProductCard product={product} showActions={true} />
                </div>
              ))}
            </div>
          </div>

          {/* Indicateurs de slide pour tous les produits */}
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: Math.ceil(allProducts.length / 2) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentProductSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentProductSlide ? 'bg-purple-600 scale-125' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section CTA */}
      <div className="px-4 py-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-center text-white">
          <h3 className="text-lg font-bold mb-2">Besoin d'aide ?</h3>
          <p className="text-blue-100 text-sm mb-4">
            Notre équipe est là pour vous conseiller
          </p>
          <div className="flex space-x-3">
            <button className="flex-1 bg-white text-blue-600 px-4 py-2 rounded-xl font-medium text-sm hover:bg-gray-100 transition-colors">
              💬 Contacter
            </button>
            <button className="flex-1 bg-transparent border border-white text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-white/10 transition-colors">
              📞 Appeler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernHome;
