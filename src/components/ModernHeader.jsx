import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, X, Package, Tag } from 'lucide-react';
import { cartService, authService, productService, categoryService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const ModernHeader = () => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { getTotalItems } = useCart();
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const loadCartCount = async () => {
      try {
        const cartSessionId = localStorage.getItem('cart_session_id');
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

    loadCartCount();

    const handleStorageChange = () => loadCartCount();
    window.addEventListener('storage', handleStorageChange);

    const handleCartUpdate = (event) => {
      if (event?.detail) {
        setCartItemCount(event.detail.totalItems || 0);
      }
    };
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  useEffect(() => {
    setCartItemCount(getTotalItems());
  }, [getTotalItems]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        if (response.success) {
          setCategories(response.data.categories || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    };
    loadCategories();
  }, []);

  const normalizeText = useCallback((text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, '')
      .trim();
  }, []);

  const performSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const normalizedQuery = normalizeText(query);
      const productsResponse = await productService.getProducts({ search: query, per_page: 5 });

      let results = [];
      if (productsResponse.success && productsResponse.data.products) {
        results = productsResponse.data.products.map((product) => ({
          id: product.id,
          name: product.name,
          type: 'product',
          price: product.base_price,
          image: product.image_main,
          category: product.category?.name || 'Catégorie inconnue',
        }));
      }

      const matchingCategories = categories
        .filter((category) => {
          const normalizedName = normalizeText(category.name);
          const normalizedDescription = normalizeText(category.description || '');
          return normalizedName.includes(normalizedQuery) || normalizedDescription.includes(normalizedQuery);
        })
        .slice(0, 3)
        .map((category) => ({
          id: category.id,
          name: category.name,
          type: 'category',
          description: category.description,
          image: category.image_main,
          slug: category.slug,
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

  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => performSearch(query), 300);
  }, [performSearch]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowMobileSearch(false);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const preloadProductData = useCallback(async (productId) => {
    try {
      const sessionCacheKey = `bs_shop_product_cache_${productId}`;
      if (!sessionStorage.getItem(sessionCacheKey)) {
        const response = await productService.getProduct(productId);
        if (response.success && response.data) {
          sessionStorage.setItem(sessionCacheKey, JSON.stringify({ data: response.data, timestamp: Date.now() }));
        }
      }
    } catch (error) {
      console.warn('Erreur lors du préchargement du produit:', error);
    }
  }, []);

  const handleSuggestionClick = (result) => {
    if (result.type === 'product') {
      preloadProductData(result.id);
      navigate(`/products/${result.id}`);
    } else if (result.type === 'category') {
      navigate(`/catalog/${result.slug || result.name.toLowerCase().replace(/\s+/g, '-')}`);
    }
    setShowMobileSearch(false);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setIsSearchFocused(false);
    }, 200);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowMobileSearch(false);
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

  const renderSearchBar = (mobile = false) => (
    <div className={`relative ${mobile ? 'w-full' : 'flex-1 max-w-xl mx-4'}`}>
      <form onSubmit={handleSearch}>
        <div className={`relative transition-all duration-300 ${isSearchFocused ? 'scale-[1.01]' : ''}`}>
          <Search
            size={18}
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${isSearchFocused ? 'text-brand-green' : 'text-gray-400'}`}
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Rechercher huile, savon, épice..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={handleSearchBlur}
            onKeyDown={handleKeyDown}
            autoFocus={mobile}
            className="w-full pl-10 pr-10 py-2.5 md:py-3 bg-brand-cream border border-gray-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green text-gray-900 placeholder-gray-500 text-sm md:text-base"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-green border-t-transparent" />
            </div>
          )}
        </div>
      </form>

      {showSuggestions && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            {searchResults.map((result, index) => (
              <button
                key={`${result.type}-${result.id}-${index}`}
                type="button"
                onClick={() => handleSuggestionClick(result)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brand-green-light transition-colors text-left"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  result.type === 'product' ? 'bg-brand-green-light' : 'bg-brand-orange-light'
                }`}>
                  {result.type === 'product' ? (
                    <Package size={16} className="text-brand-green" />
                  ) : (
                    <Tag size={16} className="text-brand-orange" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{result.name}</p>
                  {result.type === 'product' && result.price && (
                    <p className="text-sm text-brand-green font-medium">{Math.round(Number(result.price))} FCFA</p>
                  )}
                  {result.type === 'category' && result.description && (
                    <p className="text-sm text-gray-500 truncate">{result.description}</p>
                  )}
                </div>
              </button>
            ))}
            {searchQuery.trim() && (
              <div className="border-t border-gray-100 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    setShowMobileSearch(false);
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 text-brand-green hover:bg-brand-green-light rounded-xl transition-colors text-sm font-medium"
                >
                  <Search size={16} />
                  Voir tous les résultats pour « {searchQuery} »
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex-shrink-0">
            <img
              src="/logo-header.png"
              alt="AfrikRaga — Produits authentiques du Maroc"
              className="h-9 md:h-10 w-auto object-contain"
            />
          </Link>

          <div className="hidden md:block flex-1">
            {renderSearchBar(false)}
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden p-2 rounded-lg hover:bg-brand-green-light transition-colors"
              aria-label="Rechercher"
            >
              {showMobileSearch ? (
                <X size={20} className="text-gray-600" />
              ) : (
                <Search size={20} className="text-gray-600" />
              )}
            </button>
            <Link to="/cart" className="p-2 rounded-lg hover:bg-brand-green-light transition-colors relative">
              <ShoppingCart size={20} className="text-gray-700" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-orange text-white text-xs rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center font-semibold">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={handleProfileClick}
              className="p-2 rounded-lg hover:bg-brand-green-light transition-colors"
              aria-label="Mon compte"
            >
              <User size={20} className="text-gray-700" />
            </button>
          </div>
        </div>

        {showMobileSearch && (
          <div className="md:hidden mt-3">
            {renderSearchBar(true)}
          </div>
        )}
      </div>
    </header>
  );
};

export default ModernHeader;
