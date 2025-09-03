import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingCart, User, X, Package, Tag } from 'lucide-react';
import { cartService, authService, productService, categoryService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const ModernHeader = () => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const { isAdmin, isClient } = useAuth();
  const { getTotalItems } = useCart();
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  // Récupérer le nombre d'articles dans le panier
  useEffect(() => {
    const loadCartCount = async () => {
      try {
        // Récupérer la session ID du panier depuis le localStorage
        const cartSessionId = localStorage.getItem('cart_session_id');
        
        // Préparer les headers avec la session du panier
        const headers = {};
        if (cartSessionId) {
          headers['X-Session-ID'] = cartSessionId;
        }
        
        const response = await cartService.getCart(headers);
        if (response.success) {
          setCartItemCount(response.data.summary?.total_items || 0);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du compteur du panier:', error);
        setCartItemCount(0);
      }
    };

    // Charger le compteur au montage du composant
    loadCartCount();

    // Écouter les changements dans le localStorage pour mettre à jour le compteur
    const handleStorageChange = () => {
      loadCartCount();
    };

    // Écouter les événements de stockage
    window.addEventListener('storage', handleStorageChange);
    
    // Écouter les événements personnalisés pour la mise à jour du panier
    const handleCartUpdate = (event) => {
      if (event && event.detail) {
        setCartItemCount(event.detail.totalItems || 0);
      }
    };
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Synchroniser avec le contexte du panier
  useEffect(() => {
    setCartItemCount(getTotalItems());
  }, [getTotalItems]);

  // Charger les catégories pour l'autocomplétion
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        if (response.success) {
          const categoriesData = response.data.categories || [];
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    };
    
    loadCategories();
  }, []);

  // Fonction pour normaliser le texte (enlever accents, convertir en minuscules)
  const normalizeText = useCallback((text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^\w\s]/g, '') // Enlever la ponctuation
      .trim();
  }, []);

  // Fonction de recherche avec debounce
  const performSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const normalizedQuery = normalizeText(query);
      
      // Rechercher dans les produits
      const productsResponse = await productService.getProducts({
        search: query,
        per_page: 5
      });

      let results = [];
      
      if (productsResponse.success && productsResponse.data.products) {
        const products = productsResponse.data.products.map(product => ({
          id: product.id,
          name: product.name,
          type: 'product',
          price: product.base_price,
          image: product.image_main,
          category: product.category?.name || 'Catégorie inconnue'
        }));
        results = [...results, ...products];
      }

      // Rechercher dans les catégories (insensible à la casse et aux accents)
      const matchingCategories = categories.filter(category => {
        const normalizedName = normalizeText(category.name);
        const normalizedDescription = normalizeText(category.description || '');
        return normalizedName.includes(normalizedQuery) || 
               normalizedDescription.includes(normalizedQuery);
      }).slice(0, 3).map(category => ({
        id: category.id,
        name: category.name,
        type: 'category',
        description: category.description,
        image: category.image_main
      }));

      results = [...results, ...matchingCategories];
      
      setSearchResults(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSearchResults([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  }, [categories, normalizeText]);

  // Gérer le changement de recherche avec debounce
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Annuler le timeout précédent
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Définir un nouveau timeout pour la recherche
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  }, [performSearch]);

  // Nettoyer les timeouts au démontage
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  // Gérer la sélection d'une suggestion avec préchargement
  const handleSuggestionClick = (result) => {
    console.log('🔍 Clic sur suggestion:', result);
    
    if (result.type === 'product') {
      console.log('📦 Navigation vers produit ID:', result.id);
      // Précharger les données du produit pour accélérer le chargement
      preloadProductData(result.id);
      // Utiliser la route /products/ID au lieu de /product/ID
      navigate(`/products/${result.id}`);
    } else if (result.type === 'category') {
      console.log('🏷️ Navigation vers catégorie:', result.name);
      navigate(`/catalog/${result.name.toLowerCase().replace(/\s+/g, '-')}`);
    }
    setShowSearch(false);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  // Fonction de préchargement des données produit
  const preloadProductData = useCallback(async (productId) => {
    try {
      // Vérifier si le produit n'est pas déjà en cache
      const sessionCacheKey = `bs_shop_product_cache_${productId}`;
      const cached = sessionStorage.getItem(sessionCacheKey);
      
      if (!cached) {
        // Précharger les données du produit en arrière-plan
        const response = await productService.getProduct(productId);
        if (response.success && response.data) {
          // Mettre en cache pour accélérer le chargement de la page
          const sessionData = {
            data: response.data,
            timestamp: Date.now()
          };
          sessionStorage.setItem(sessionCacheKey, JSON.stringify(sessionData));
        }
      }
    } catch (error) {
      console.warn('Erreur lors du préchargement du produit:', error);
    }
  }, []);

  // Gérer la fermeture des suggestions
  const handleSearchBlur = () => {
    // Délai pour permettre le clic sur les suggestions
    setTimeout(() => {
      setShowSuggestions(false);
      setIsSearchFocused(false);
    }, 200);
  };

  // Gérer la navigation au clavier
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSearch(false);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    
    if (!authService.isAuthenticated()) {
      navigate('/auth/login');
    } else if (isAdmin()) {
      navigate('/admin');
    } else {
      navigate('/profile');
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
      <div className="px-4 py-3">
        {/* Barre supérieure avec logo et actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2">
            <div className="w-27 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">AfrikRaga</span>
            </div>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {showSearch ? <X size={20} className="text-gray-600" /> : <Search size={20} className="text-gray-600" />}
            </button>
            <Link to="/cart" className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
              <ShoppingCart size={20} className="text-gray-600" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>
            <button
              onClick={handleProfileClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <User size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Barre de recherche centrale - conditionnelle */}
        {showSearch && (
          <div className="relative">
            <form onSubmit={handleSearch}>
              <div className={`relative transition-all duration-300 ${
                isSearchFocused ? 'scale-105' : 'scale-100'
              }`}>
                <Search 
                  size={20} 
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                    isSearchFocused ? 'text-blue-500' : 'text-gray-400'
                  }`} 
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Rechercher un produit ou une catégorie..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={handleSearchBlur}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                  autoFocus
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                )}
              </div>
            </form>

            {/* Suggestions d'autocomplétion */}
            {showSuggestions && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 max-h-80 overflow-y-auto">
                <div className="p-2">
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}-${index}`}
                      onClick={() => handleSuggestionClick(result)}
                      className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                    >
                      <div className="flex-shrink-0 relative">
                        {result.type === 'product' ? (
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <Package size={16} className="text-blue-600" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                            <Tag size={16} className="text-green-600" />
                          </div>
                        )}
                        {result.type === 'product' && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-full h-full bg-blue-500 rounded-full animate-ping"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 truncate">{result.name}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.type === 'product' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {result.type === 'product' ? 'Produit' : 'Catégorie'}
                          </span>
                        </div>
                        {result.type === 'product' && result.price && (
                          <p className="text-sm text-gray-500">
                            {Math.round(Number(result.price))} FCFA
                          </p>
                        )}
                        {result.type === 'product' && result.category && (
                          <p className="text-xs text-gray-400">{result.category}</p>
                        )}
                        {result.type === 'category' && result.description && (
                          <p className="text-sm text-gray-500 truncate">{result.description}</p>
                        )}
                      </div>
                    </button>
                  ))}
                  
                  {/* Lien vers la page de recherche complète */}
                  {searchQuery.trim() && (
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={() => {
                          console.log('🔍 Navigation vers résultats de recherche:', searchQuery);
                          navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                          setShowSearch(false);
                          setSearchQuery('');
                          setShowSuggestions(false);
                        }}
                        className="w-full flex items-center justify-center space-x-2 p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      >
                        <Search size={16} />
                        <span className="font-medium">Voir tous les résultats pour "{searchQuery}"</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default ModernHeader;
