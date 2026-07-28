import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Package, Tag } from 'lucide-react';
import { cartService, authService, productService, categoryService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import SearchOverlay from './SearchOverlay';
import { formatPrice } from '../utils/productPrice';

const ModernHeader = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { getTotalItems } = useCart();
  const searchTimeoutRef = useRef(null);
  const desktopSearchRef = useRef(null);

  useEffect(() => {
    setSearchOverlayOpen(false);
    setDesktopSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const loadCartCount = async () => {
      try {
        const cartSessionId = localStorage.getItem('cart_session_id');
        const headers = {};
        if (cartSessionId) headers['X-Session-ID'] = cartSessionId;
        const response = await cartService.getCart(headers);
        if (response.success) {
          setCartItemCount(response.data.summary?.total_items || 0);
        }
      } catch {
        setCartItemCount(0);
      }
    };
    loadCartCount();

    const handleStorageChange = () => loadCartCount();
    const handleCartUpdate = (event) => {
      if (event?.detail) setCartItemCount(event.detail.totalItems || 0);
    };
    window.addEventListener('storage', handleStorageChange);
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
    categoryService.getCategories().then((response) => {
      if (response.success) setCategories(response.data.categories || []);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target)) {
        setDesktopSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const performSearch = useCallback(
    async (query) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const normalizedQuery = normalizeText(query);
        const productsResponse = await productService.getProducts({ search: query, per_page: 6 });

        let results = [];
        if (productsResponse.success && productsResponse.data.products) {
          results = productsResponse.data.products.map((product) => ({
            id: product.id,
            name: product.name,
            type: 'product',
            price: product.min_price ?? product.base_price,
            image: product.image_main,
            category: product.category?.name || '',
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
            slug: category.slug,
          }));

        setSearchResults([...results, ...matchingCategories]);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [categories, normalizeText]
  );

  const handleSearchChange = useCallback(
    (e) => {
      const query = e.target.value;
      setSearchQuery(query);
      setDesktopSearchOpen(true);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => performSearch(query), 280);
    },
    [performSearch]
  );

  useEffect(() => () => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
  }, []);

  const goToSearchResults = useCallback(
    (query) => {
      const trimmed = (query ?? searchQuery).trim();
      if (!trimmed) return;
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      setSearchQuery('');
      setSearchResults([]);
      setDesktopSearchOpen(false);
    },
    [navigate, searchQuery]
  );

  const handleSearch = (e) => {
    e.preventDefault();
    goToSearchResults(searchQuery);
  };

  const preloadProductData = useCallback(async (productId) => {
    try {
      const key = `bs_shop_product_cache_${productId}`;
      if (!sessionStorage.getItem(key)) {
        const response = await productService.getProduct(productId);
        if (response.success && response.data) {
          sessionStorage.setItem(key, JSON.stringify({ data: response.data, timestamp: Date.now() }));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleSuggestionClick = (result) => {
    if (result.type === 'product') {
      preloadProductData(result.id);
      navigate(`/products/${result.id}`);
    } else if (result.type === 'category') {
      navigate(`/catalog/${result.slug}`);
    }
    setSearchQuery('');
    setSearchResults([]);
    setDesktopSearchOpen(false);
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    if (!authService.isAuthenticated()) navigate('/auth/login');
    else if (isAdmin()) navigate('/admin');
    else navigate('/profile');
  };

  const showSuggestions = searchQuery.trim().length >= 2 && (searchResults.length > 0 || isSearching);

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 md:h-16 flex items-center gap-3">
          <Link to="/" className="flex-shrink-0">
            <img
              src="/logo-header.png"
              alt="AfrikRaga"
              className="h-9 md:h-10 w-auto object-contain"
            />
          </Link>

          {/* Recherche desktop — zone stable, dropdown en position absolue */}
          <div ref={desktopSearchRef} className="hidden md:block flex-1 max-w-xl mx-4 relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Rechercher huile, savon, épice…"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setDesktopSearchOpen(true)}
                  className="w-full pl-10 pr-10 py-2.5 bg-brand-cream border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green text-sm text-gray-900"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-green border-t-transparent" />
                  </div>
                )}
              </div>
            </form>

            {desktopSearchOpen && showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] max-h-80 overflow-y-auto">
                <div className="p-2">
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}-${index}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSuggestionClick(result)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-brand-green-light transition-colors text-left"
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          result.type === 'product' ? 'bg-brand-green-light' : 'bg-brand-orange-light'
                        }`}
                      >
                        {result.type === 'product' ? (
                          <Package size={15} className="text-brand-green" />
                        ) : (
                          <Tag size={15} className="text-brand-orange" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm">{result.name}</p>
                        {result.type === 'product' && result.price != null && (
                          <p className="text-xs text-brand-green font-medium">{formatPrice(result.price)}</p>
                        )}
                      </div>
                    </button>
                  ))}
                  {searchQuery.trim().length >= 2 && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => goToSearchResults(searchQuery)}
                      className="w-full mt-1 p-3 text-sm font-semibold text-brand-green hover:bg-brand-green-light rounded-lg transition-colors"
                    >
                      Voir tous les résultats pour « {searchQuery} »
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-0.5 ml-auto">
            <button
              type="button"
              onClick={() => setSearchOverlayOpen(true)}
              className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-brand-green-light transition-colors"
              aria-label="Ouvrir la recherche"
            >
              <Search size={20} className="text-gray-700" />
            </button>

            <Link
              to="/cart"
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-brand-green-light transition-colors relative"
              aria-label="Panier"
            >
              <ShoppingCart size={20} className="text-gray-700" />
              {cartItemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-brand-orange text-white text-[10px] rounded-full min-w-[1.1rem] h-[1.1rem] px-0.5 flex items-center justify-center font-bold">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={handleProfileClick}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-brand-green-light transition-colors"
              aria-label="Mon compte"
            >
              <User size={20} className="text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      <SearchOverlay
        open={searchOverlayOpen}
        onClose={() => {
          setSearchOverlayOpen(false);
          setSearchQuery('');
          setSearchResults([]);
        }}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSubmit={handleSearch}
        searchResults={searchResults}
        showSuggestions={searchQuery.trim().length >= 2 && searchResults.length > 0}
        isSearching={isSearching}
        onSuggestionClick={handleSuggestionClick}
        onViewAllResults={() => goToSearchResults(searchQuery)}
      />
    </>
  );
};

export default ModernHeader;
