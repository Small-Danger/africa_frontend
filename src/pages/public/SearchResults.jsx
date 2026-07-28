import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Package, Tag, Filter, Grid, List, ArrowRight } from 'lucide-react';
import { productService, categoryService } from '../../services/api';
import ProductCard from '../../components/ProductCard';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    category: '',
  });

  const normalizeText = useCallback((text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, '')
      .trim();
  }, []);

  const loadSearchResults = useCallback(async () => {
    if (!query.trim()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const normalizedQuery = normalizeText(query);

      const productsResponse = await productService.getProducts({
        search: query,
        per_page: 50,
        sort: sortBy === 'price_asc' ? 'base_price' : sortBy === 'price_desc' ? 'base_price' : 'created_at',
        sort_order: sortBy === 'price_asc' ? 'asc' : 'desc',
      });

      if (productsResponse.success) {
        setProducts(productsResponse.data.products || []);
      }

      const categoriesResponse = await categoryService.getCategories();
      if (categoriesResponse.success) {
        const allCategories = categoriesResponse.data.categories || [];
        const matchingCategories = allCategories.filter((category) => {
          const normalizedName = normalizeText(category.name);
          const normalizedDescription = normalizeText(category.description || '');
          return normalizedName.includes(normalizedQuery) || normalizedDescription.includes(normalizedQuery);
        });
        setCategories(matchingCategories);
      }
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      setError('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [query, sortBy, normalizeText]);

  useEffect(() => {
    loadSearchResults();
  }, [loadSearchResults]);

  const filteredProducts = products.filter((product) => {
    if (filters.minPrice && Number(product.base_price) < Number(filters.minPrice)) return false;
    if (filters.maxPrice && Number(product.base_price) > Number(filters.maxPrice)) return false;
    if (filters.category && product.category_id !== Number(filters.category)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center pb-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4" />
          <p className="text-gray-600">Recherche en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* En-tête */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-brand-green-light rounded-full px-4 py-1.5 mb-3">
            <Search size={14} className="text-brand-green" />
            <span className="text-sm font-semibold text-brand-green">Recherche</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
            {query ? `Résultats pour « ${query} »` : 'Rechercher un produit'}
          </h1>
          <p className="text-sm text-gray-600">
            {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
            {categories.length > 0 && ` · ${categories.length} catégorie${categories.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filtres */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Filter size={16} className="text-brand-green" />
                Filtres
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Prix min (FCFA)</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Prix max (FCFA)</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFilters({ minPrice: '', maxPrice: '', category: '' })}
                  className="w-full text-sm text-brand-green hover:text-brand-green-dark font-medium"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </aside>

          {/* Résultats */}
          <div className="lg:col-span-3">
            {/* Catégories trouvées */}
            {categories.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Tag size={16} className="text-brand-orange" />
                  Catégories
                </h2>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/catalog/${cat.slug}`}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-brand-green/40 hover:text-brand-green transition-colors"
                    >
                      {cat.name}
                      <ArrowRight size={14} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Barre outils */}
            <div className="flex items-center justify-between mb-4 gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white"
              >
                <option value="relevance">Pertinence</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </select>
              <div className="flex bg-white border border-gray-200 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-brand-green-light text-brand-green' : 'text-gray-400'}`}
                >
                  <Grid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-brand-green-light text-brand-green' : 'text-gray-400'}`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Produits */}
            {filteredProducts.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4' : 'space-y-3'}>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} showActions className={viewMode === 'list' ? 'max-w-none' : ''} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Package size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun produit trouvé</h3>
                <p className="text-gray-600 text-sm mb-6">Essayez un autre mot-clé ou parcourez le catalogue.</p>
                <Link
                  to="/catalog"
                  className="inline-flex items-center px-6 py-3 bg-brand-orange text-white rounded-xl font-medium hover:bg-brand-orange-dark transition-colors"
                >
                  Voir le catalogue
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
