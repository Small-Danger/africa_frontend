import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { categoryService, productService } from '../../services/api';
import { ShimmerTextVariants } from '../../components/ShimmerText';

const ModernCatalog = () => {
  const { categorySlug, subcategorySlug } = useParams();
  const [currentCategory, setCurrentCategory] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination côté client
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const PRODUCTS_PER_PAGE = 12;
  
  // Cache désactivé temporairement
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);
  
  // Cache persistant de session - DÉSACTIVÉ
  const SESSION_CACHE_KEY_CATEGORIES = 'bs_shop_categories_cache';
  const SESSION_CACHE_KEY_PRODUCTS = 'bs_shop_products_cache';
  const SESSION_CACHE_TTL_CATEGORIES = 0; // Cache désactivé
  const SESSION_CACHE_TTL_PRODUCTS = 0; // Cache désactivé

  // Charger les catégories depuis l'API avec cache
  useEffect(() => {
    const loadCategories = async () => {
      // Vérifier le cache de session d'abord
      try {
        const sessionCached = sessionStorage.getItem(SESSION_CACHE_KEY_CATEGORIES);
        if (sessionCached) {
          const { data, timestamp } = JSON.parse(sessionCached);
          if (Date.now() - timestamp < SESSION_CACHE_TTL_CATEGORIES) {
            setCategories(data);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.warn('Erreur lors de la lecture du cache de session des catégories:', error);
      }

      // Vérifier le cache mémoire
      const cacheKey = 'categories';
      const cached = cacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes
        setCategories(cached.data);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await categoryService.getCategories();
        
        if (response.success) {
          const categoriesData = response.data.categories;
          setCategories(categoriesData);
          
          // Mettre en cache de session
          try {
            const sessionData = {
              data: categoriesData,
              timestamp: Date.now()
            };
            sessionStorage.setItem(SESSION_CACHE_KEY_CATEGORIES, JSON.stringify(sessionData));
          } catch (error) {
            console.warn('Erreur lors de la sauvegarde du cache de session des catégories:', error);
          }

          // Mettre en cache mémoire
          cacheRef.current.set(cacheKey, {
            data: categoriesData,
            timestamp: Date.now()
          });
        } else {
          setError('Erreur lors du chargement des catégories');
        }
      } catch (err) {
        setError('Erreur lors du chargement des catégories');
      } finally {
        setLoading(false);
      }
    };
    
    loadCategories();
  }, []);

  // Charger les produits filtrés quand les paramètres changent avec cache et annulation
  useEffect(() => {
    const loadProducts = async () => {
      if (!categories.length) return;
      
      // Annuler la requête précédente
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      try {
        setLoading(true);
        setError(null);
        
        let filters = {};
        let category = null;
        
        if (categorySlug) {
          category = categories.find(cat => cat.slug === categorySlug);
          setCurrentCategory(category);
          
          if (subcategorySlug && category) {
            // Cas 3: /catalog/categorie-parent/sous-categorie → Seulement les produits de la sous-catégorie
            const subcategory = category.subcategories?.find(sub => sub.slug === subcategorySlug);
            if (subcategory) {
              filters.subcategory_id = subcategory.id;
            } else {
              setFilteredProducts([]);
              setLoading(false);
              return;
            }
          } else if (category && !subcategorySlug) {
            // Cas 2: /catalog/categorie-parent → Produits directs de la catégorie parent seulement
            filters.category_id = category.id;
          }
        } else {
          // Cas 1: /catalog → Pas de produits, seulement les catégories
          setCurrentCategory(null);
          setFilteredProducts([]);
          setLoading(false);
          return;
        }
        
        // Vérifier le cache de session pour les produits
        const productsCacheKey = `${SESSION_CACHE_KEY_PRODUCTS}_${JSON.stringify(filters)}`;
        try {
          const sessionCached = sessionStorage.getItem(productsCacheKey);
          if (sessionCached) {
            const { data, timestamp } = JSON.parse(sessionCached);
            if (Date.now() - timestamp < SESSION_CACHE_TTL_PRODUCTS) {
              setFilteredProducts(data);
              // Initialiser l'affichage avec les premiers produits
              const initialProducts = data.slice(0, PRODUCTS_PER_PAGE);
              setDisplayedProducts(initialProducts);
              setHasMoreProducts(data.length > PRODUCTS_PER_PAGE);
              setCurrentPage(1);
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.warn('Erreur lors de la lecture du cache de session des produits:', error);
        }

        // Vérifier le cache mémoire pour les produits
        const cacheKey = `products_${JSON.stringify(filters)}`;
        const cached = cacheRef.current.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 3 * 60 * 1000) { // 3 minutes
          setFilteredProducts(cached.data);
          // Initialiser l'affichage avec les premiers produits
          const initialProducts = cached.data.slice(0, PRODUCTS_PER_PAGE);
          setDisplayedProducts(initialProducts);
          setHasMoreProducts(cached.data.length > PRODUCTS_PER_PAGE);
          setCurrentPage(1);
          setLoading(false);
          return;
        }
        
        const productsResponse = await productService.getProducts({ ...filters, per_page: 100 });
        
        if (productsResponse.success) {
          let products = productsResponse.data.products;
          
          // Pour le cas 2: Filtrer seulement les produits directs de la catégorie parent
          if (categorySlug && category && !subcategorySlug) {
            products = products.filter(product => product.category_id === category.id);
          }
          
          setFilteredProducts(products);
          
          // Initialiser l'affichage avec les premiers produits
          const initialProducts = products.slice(0, PRODUCTS_PER_PAGE);
          setDisplayedProducts(initialProducts);
          setHasMoreProducts(products.length > PRODUCTS_PER_PAGE);
          setCurrentPage(1);
          
          // Mettre en cache de session
          try {
            const sessionData = {
              data: products,
              timestamp: Date.now()
            };
            sessionStorage.setItem(productsCacheKey, JSON.stringify(sessionData));
          } catch (error) {
            console.warn('Erreur lors de la sauvegarde du cache de session des produits:', error);
          }
          
          // Mettre en cache mémoire
          cacheRef.current.set(cacheKey, {
            data: products,
            timestamp: Date.now()
          });
        } else {
          setError('Erreur lors du chargement des produits');
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Erreur lors du chargement des produits');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [categorySlug, subcategorySlug, categories]);

  // Fonction pour charger plus de produits
  const loadMoreProducts = useCallback(async () => {
    if (loadingMore || !hasMoreProducts) return;
    
    setLoadingMore(true);
    
    // Simuler un délai pour l'UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const nextPage = currentPage + 1;
    const startIndex = currentPage * PRODUCTS_PER_PAGE; // Utiliser currentPage au lieu de nextPage
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    const nextProducts = filteredProducts.slice(startIndex, endIndex);
    
    console.log('🔄 Chargement plus de produits:', {
      currentPage,
      nextPage,
      startIndex,
      endIndex,
      nextProductsCount: nextProducts.length,
      totalFiltered: filteredProducts.length,
      displayedCount: displayedProducts.length
    });
    
    setDisplayedProducts(prev => [...prev, ...nextProducts]);
    setCurrentPage(nextPage);
    setHasMoreProducts(endIndex < filteredProducts.length);
    setLoadingMore(false);
  }, [loadingMore, hasMoreProducts, currentPage, filteredProducts, displayedProducts.length]);

  // Affichage du chargement
  if (loading) {
    return <ShimmerTextVariants.PageLoader subtitle="Chargement du catalogue..." />;
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {!categorySlug ? (
          // 🏠 PAGE PRINCIPALE - Liste des catégories
          <div>
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                Découvrez nos catégories
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explorez notre sélection de produits organisés par catégories pour une expérience d'achat optimale
              </p>
            </div>
            
            {categories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category, index) => (
                  <Link
                    key={category.id}
                    to={`/catalog/${category.slug}`}
                    className="block group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 transform-gpu animate-fade-in-up">
                      {/* Image de la catégorie - Optimisée */}
                      <div className="h-56 bg-gray-50 relative overflow-hidden flex items-center justify-center">
                        {category.image_main ? (
                          <div className="w-full max-w-md mx-auto h-full flex items-center justify-center">
                            <img
                              src={category.image_main}
                              alt={category.name}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out rounded-lg"
                              style={{
                                imageRendering: 'high-quality',
                                WebkitImageRendering: 'high-quality'
                              }}
                              loading="lazy"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          </div>
                        ) : null}
                        
                        {/* Fallback avec icône si pas d'image - Amélioré */}
                        <div 
                          className={`w-full h-full flex items-center justify-center ${
                            category.image_main ? 'hidden' : 'flex'
                          } bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100`}
                        >
                          <div className="text-center">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                            <span className="text-blue-600 font-medium text-sm">Catégorie</span>
                          </div>
                        </div>
                        
                        {/* Overlay avec gradient subtil */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Badge flottant */}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                          <span className="text-sm font-semibold text-blue-600">Explorer</span>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                            {category.name}
                          </h3>
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300 group-hover:scale-110">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                        
                        {category.description && (
                          <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">{category.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <span>{category.subcategories?.length || 0} sous-catégorie{(category.subcategories?.length || 0) > 1 ? 's' : ''}</span>
                          </div>
                          
                          <span className="text-blue-600 font-semibold text-sm group-hover:text-blue-700 transition-colors duration-300 flex items-center">
                            Découvrir
                            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl shadow-lg border border-gray-100">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Aucune catégorie disponible</h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto">
                  Nous travaillons actuellement sur l'organisation de nos catégories. Revenez bientôt !
                </p>
              </div>
            )}
          </div>
        ) : (
          // 🎯 PAGE CATÉGORIE - Produits ou sous-catégories
          <div>
            {/* Breadcrumb moderne et navigation */}
            <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 p-4 mb-6 animate-slide-in-down">
              <div className="flex items-center justify-between">
                {/* Navigation principale */}
                <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
                  <Link 
                    to="/catalog" 
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-xl font-medium transition-all duration-200 hover:from-blue-100 hover:to-indigo-100 active:scale-95 whitespace-nowrap shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-sm">Accueil</span>
                  </Link>
                  
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  
                  <Link 
                    to="/catalog" 
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all duration-200 active:scale-95 whitespace-nowrap"
                  >
                    <span className="text-sm">Catalogue</span>
                  </Link>
                  
                  {categorySlug && (
                    <>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      
                      <div className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 rounded-xl font-medium whitespace-nowrap shadow-sm">
                        <span className="text-sm">{currentCategory?.name}</span>
                      </div>
                    </>
                  )}
                  
                  {subcategorySlug && (
                    <>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      
                      <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-900 rounded-xl font-medium whitespace-nowrap shadow-sm">
                        <span className="text-sm">
                          {currentCategory?.subcategories?.find(sub => sub.slug === subcategorySlug)?.name}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Bouton retour rapide */}
                <button 
                  onClick={() => window.history.back()}
                  className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-600 rounded-xl transition-all duration-200 active:scale-95 ml-3 shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              
              {/* Indicateur de progression visuel */}
              <div className="mt-4 flex items-center space-x-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out shadow-sm"
                    style={{ 
                      width: subcategorySlug ? '100%' : categorySlug ? '66%' : '33%' 
                    }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full shadow-sm">
                  {subcategorySlug ? '3/3' : categorySlug ? '2/3' : '1/3'}
                </span>
              </div>
            </div>

            {currentCategory && (
              <div>
                {/* Header de la catégorie avec image - Optimisé */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8 animate-fade-in-up">
                  <div className="h-64 bg-gray-50 relative overflow-hidden flex items-center justify-center">
                    {currentCategory.image_main ? (
                      <div className="w-full max-w-md mx-auto h-full flex items-center justify-center">
                        <img
                          src={currentCategory.image_main}
                          alt={currentCategory.name}
                          className="w-full h-full object-cover object-center rounded-lg"
                          style={{
                            imageRendering: 'high-quality',
                            WebkitImageRendering: 'high-quality'
                          }}
                          loading="eager"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      </div>
                    ) : null}
                    
                    {/* Fallback amélioré */}
                    <div className={`w-full h-full flex items-center justify-center ${currentCategory.image_main ? 'hidden' : 'flex'}`}>
                      <div className="text-center">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <span className="text-blue-600 font-medium text-lg">Catégorie</span>
                      </div>
                    </div>
                    
                    {/* Overlay avec titre */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-8">
                      <h2 className="text-4xl font-bold text-white mb-3">{currentCategory.name}</h2>
                      {currentCategory.description && (
                        <p className="text-white/90 text-xl leading-relaxed">{currentCategory.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Affichage des sous-catégories si elles existent */}
                {!subcategorySlug && currentCategory.subcategories && currentCategory.subcategories.length > 0 && (
                  <div className="mb-12">
                    <h3 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      Sous-catégories
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentCategory.subcategories.map((subcategory, index) => (
                        <Link
                          key={subcategory.id}
                          to={`/catalog/${categorySlug}/${subcategory.slug}`}
                          className="block group"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 transform-gpu animate-fade-in-up">
                            {/* Image de la sous-catégorie - Optimisée */}
                            <div className="h-40 bg-gray-50 relative overflow-hidden flex items-center justify-center">
                              {subcategory.image_main ? (
                                <div className="w-full max-w-md mx-auto h-full flex items-center justify-center">
                                  <img
                                    src={subcategory.image_main}
                                    alt={subcategory.name}
                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out rounded-lg"
                                    style={{
                                      imageRendering: 'high-quality',
                                      WebkitImageRendering: 'high-quality'
                                    }}
                                    loading="lazy"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                </div>
                              ) : null}
                              
                              {/* Fallback amélioré */}
                              <div className={`w-full h-full flex items-center justify-center ${subcategory.image_main ? 'hidden' : 'flex'}`}>
                                <div className="text-center">
                                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                                    <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                  </div>
                                  <span className="text-indigo-600 font-medium text-xs">Sous-catégorie</span>
                                </div>
                              </div>
                              
                              {/* Badge flottant */}
                              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                                <span className="text-sm font-semibold text-indigo-600">Voir</span>
                              </div>
                            </div>
                            
                            {/* Contenu de la sous-catégorie */}
                            <div className="p-5">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors duration-300">
                                  {subcategory.name}
                                </h4>
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                              
                              {subcategory.description && (
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{subcategory.description}</p>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                  {subcategory.products_count || 0} produit{(subcategory.products_count || 0) > 1 ? 's' : ''}
                                </span>
                                <span className="text-indigo-600 font-semibold text-sm group-hover:text-indigo-700 transition-colors duration-300 flex items-center">
                                  Explorer
                                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Affichage des produits - Design simplifié et intuitif */}
                {displayedProducts.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {subcategorySlug 
                          ? 'Produits'
                          : currentCategory.subcategories && currentCategory.subcategories.length > 0 
                            ? 'Produits directs' 
                            : 'Produits'
                        }
                      </h3>
                      <div className="text-sm text-gray-500">
                        {displayedProducts.length} produit{displayedProducts.length > 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {displayedProducts.map((product) => (
                        <Link
                          key={product.id}
                          to={`/products/${product.id}`}
                          className="block bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
                        >
                          {/* Image du produit - Simple et claire */}
                          <div className="aspect-square bg-gray-50 relative overflow-hidden">
                            {product.image_main ? (
                              <img
                                src={product.image_main}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            
                            {/* Image de fallback simple */}
                            <div className={`w-full h-full flex items-center justify-center ${product.image_main ? 'hidden' : 'flex'} bg-gray-100`}>
                              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            
                            {/* Indicateur de disponibilité */}
                            <div className="absolute top-3 right-3">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            </div>
                          </div>
                          
                          {/* Contenu du produit - Hiérarchie claire */}
                          <div className="p-4">
                            <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 leading-tight">
                              {product.name}
                            </h4>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-lg font-bold text-gray-900">
                                {Math.round(Number(product.base_price || 0))} FCFA
                              </div>
                              <div className="flex items-center text-blue-600 text-sm font-medium">
                                Voir
                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    
                    {/* Bouton "Voir plus" - Simple et clair */}
                    {hasMoreProducts && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={loadMoreProducts}
                          disabled={loadingMore}
                          className="flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingMore ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              <span>Chargement...</span>
                            </>
                          ) : (
                            <>
                              <span>Voir plus de produits</span>
                              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Message si aucun produit ni sous-catégorie */}
                {displayedProducts.length === 0 && (!currentCategory.subcategories || currentCategory.subcategories.length === 0) && (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun produit disponible</h3>
                    <p className="text-gray-600 mb-6">
                      Cette catégorie ne contient pas encore de produits.
                    </p>
                    <Link 
                      to="/catalog"
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Retour au catalogue
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Styles CSS simplifiés et optimisés */}
      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Masquer la barre de défilement */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Animations simples et fluides */
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-in-down {
          animation: slideInDown 0.3s ease-out;
        }
        
        /* Amélioration de la zone tactile mobile */
        .touch-manipulation {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Transitions simples */
        * {
          transition-property: color, background-color, border-color, transform, opacity;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 200ms;
        }
        
        /* Focus pour l'accessibilité */
        .focus-ring:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default ModernCatalog;