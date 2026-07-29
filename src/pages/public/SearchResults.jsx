import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search, Package, Tag, Filter, Grid, List, ArrowRight, ChevronDown, X } from 'lucide-react';
import { productService, categoryService } from '../../services/api';
import ProductCard from '../../components/ProductCard';
import {
  fieldsMatchAllTokens,
  sortBySearchRelevance,
  productSearchFields,
  categorySearchFields,
} from '../../utils/searchText';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  const [inputValue, setInputValue] = useState(query);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    category: '',
  });

  const debounceRef = useRef(null);
  const skipDebounceRef = useRef(false);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // Mise à jour automatique des résultats pendant la saisie (debounce)
  useEffect(() => {
    if (skipDebounceRef.current) {
      skipDebounceRef.current = false;
      return undefined;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const trimmed = inputValue.trim();
      const currentQuery = (searchParams.get('q') || '').trim();

      if (trimmed === currentQuery) return;

      if (trimmed) {
        navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: true });
      } else if (currentQuery) {
        navigate('/search', { replace: true });
      }
    }, 320);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, navigate, searchParams]);

  const loadSearchResults = useCallback(async () => {
    if (!query.trim()) {
      setLoading(false);
      setProducts([]);
      setCategories([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const sortParams =
        sortBy === 'price_asc' || sortBy === 'price_desc'
          ? { sort_by: 'price', sort_order: sortBy === 'price_asc' ? 'asc' : 'desc' }
          : { sort_by: 'relevance', sort_order: 'desc' };

      const productsResponse = await productService.getProducts({
        search: query,
        per_page: 50,
        ...sortParams,
      });

      if (productsResponse.success) {
        const apiProducts = productsResponse.data.products || [];
        const matched = apiProducts.filter((product) =>
          fieldsMatchAllTokens(productSearchFields(product), query)
        );
        setProducts(
          sortBy === 'relevance'
            ? sortBySearchRelevance(matched, query, productSearchFields)
            : matched
        );
      }

      const categoriesResponse = await categoryService.getCategories();
      if (categoriesResponse.success) {
        const allCategories = categoriesResponse.data.categories || [];
        const matchedCategories = allCategories.filter((category) =>
          fieldsMatchAllTokens(categorySearchFields(category), query)
        );
        setCategories(sortBySearchRelevance(matchedCategories, query, categorySearchFields));
      }
    } catch {
      setError('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [query, sortBy]);

  useEffect(() => {
    loadSearchResults();
  }, [loadSearchResults]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    skipDebounceRef.current = true;
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: true });
    } else {
      navigate('/search', { replace: true });
    }
  };

  const filteredProducts = useMemo(() => {
    let list = products.filter((product) => {
      const price = Number(product.min_price ?? product.base_price);
      if (filters.minPrice && price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && price > Number(filters.maxPrice)) return false;
      if (filters.category && product.category_id !== Number(filters.category)) return false;
      return true;
    });

    if (sortBy === 'relevance') {
      list = sortBySearchRelevance(list, query, productSearchFields);
    } else if (sortBy === 'price_asc') {
      list = [...list].sort(
        (a, b) =>
          Number(a.min_price ?? a.base_price) - Number(b.min_price ?? b.base_price)
      );
    } else if (sortBy === 'price_desc') {
      list = [...list].sort(
        (a, b) =>
          Number(b.min_price ?? b.base_price) - Number(a.min_price ?? a.base_price)
      );
    }

    return list;
  }, [products, filters, sortBy, query]);

  const hasActiveFilters = Boolean(filters.minPrice || filters.maxPrice || filters.category);

  return (
    <div className="min-h-screen bg-brand-cream pb-24 md:pb-8">
      {/* Barre de recherche dédiée — toujours accessible sur la page résultats */}
      <div className="sticky top-14 md:top-16 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-green pointer-events-none" />
            <input
              type="search"
              enterKeyHint="search"
              placeholder="Modifier votre recherche…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full pl-10 pr-11 py-3 bg-brand-cream border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green text-base"
            />
            {loading && inputValue.trim().length >= 1 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-green border-t-transparent" />
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="mb-5">
          <h1 className="text-lg md:text-xl font-bold text-gray-900">
            {query ? (
              <>
                Résultats pour <span className="text-brand-green">« {query} »</span>
              </>
            ) : (
              'Rechercher un produit'
            )}
          </h1>
          {!loading && query && (
            <p className="text-sm text-gray-600 mt-1">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
              {categories.length > 0 && ` · ${categories.length} catégorie${categories.length > 1 ? 's' : ''}`}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5 text-sm">{error}</div>
        )}

        {!query.trim() && !loading && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Search size={48} className="text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Tapez un mot-clé ci-dessus</h2>
            <p className="text-sm text-gray-500 mb-6">Ex. argan, thé, savon noir, tajine…</p>
            <Link
              to="/catalog"
              className="inline-flex items-center px-6 py-3 bg-brand-orange text-white rounded-xl font-medium"
            >
              Parcourir le catalogue
            </Link>
          </div>
        )}

        {loading && (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-green border-t-transparent mx-auto mb-3" />
            <p className="text-sm text-gray-600">Recherche en cours…</p>
          </div>
        )}

        {!loading && query.trim() && (
          <>
            {categories.length > 0 && (
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Tag size={16} className="text-brand-orange" />
                  Catégories
                </h2>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/catalog/${cat.slug}`}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-brand-green/40"
                    >
                      {cat.name}
                      <ArrowRight size={14} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 min-w-[140px] px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              >
                <option value="relevance">Pertinence</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </select>

              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  filtersOpen || hasActiveFilters
                    ? 'border-brand-green bg-brand-green-light text-brand-green-dark'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                <Filter size={16} />
                Filtres
                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-brand-orange" />}
                <ChevronDown size={14} className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className="hidden sm:flex bg-white border border-gray-200 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-brand-green-light text-brand-green' : 'text-gray-400'}`}
                  aria-label="Grille"
                >
                  <Grid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-brand-green-light text-brand-green' : 'text-gray-400'}`}
                  aria-label="Liste"
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {filtersOpen && (
              <div className="mb-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Filtrer par prix</h3>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() => setFilters({ minPrice: '', maxPrice: '', category: '' })}
                      className="text-xs font-semibold text-brand-green flex items-center gap-1"
                    >
                      <X size={14} />
                      Effacer
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Min (FCFA)</label>
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Max (FCFA)</label>
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    />
                  </div>
                </div>
              </div>
            )}

            {filteredProducts.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4' : 'space-y-3'}>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} showActions />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Package size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun produit trouvé</h3>
                <p className="text-gray-600 text-sm mb-6">Essayez un autre mot-clé ou parcourez le catalogue.</p>
                <Link
                  to="/catalog"
                  className="inline-flex items-center px-6 py-3 bg-brand-orange text-white rounded-xl font-medium"
                >
                  Voir le catalogue
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
