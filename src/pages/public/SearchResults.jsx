import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Package, Tag, Filter, Grid, List } from 'lucide-react';
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
    category: ''
  });

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

  // Charger les résultats de recherche
  const loadSearchResults = useCallback(async () => {
    if (!query.trim()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const normalizedQuery = normalizeText(query);

      // Rechercher dans les produits
      const productsResponse = await productService.getProducts({
        search: query,
        per_page: 50,
        sort: sortBy === 'price_asc' ? 'base_price' : sortBy === 'price_desc' ? 'base_price' : 'created_at',
        sort_order: sortBy === 'price_asc' ? 'asc' : 'desc'
      });

      if (productsResponse.success) {
        setProducts(productsResponse.data.products || []);
      }

      // Rechercher dans les catégories (insensible à la casse et aux accents)
      const categoriesResponse = await categoryService.getCategories();
      if (categoriesResponse.success) {
        const allCategories = categoriesResponse.data.categories || [];
        const matchingCategories = allCategories.filter(category => {
          const normalizedName = normalizeText(category.name);
          const normalizedDescription = normalizeText(category.description || '');
          return normalizedName.includes(normalizedQuery) || 
                 normalizedDescription.includes(normalizedQuery);
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

  // Filtrer les produits selon les critères
  const filteredProducts = products.filter(product => {
    if (filters.minPrice && Number(product.base_price) < Number(filters.minPrice)) {
      return false;
    }
    if (filters.maxPrice && Number(product.base_price) > Number(filters.maxPrice)) {
      return false;
    }
    if (filters.category && product.category_id !== Number(filters.category)) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Recherche en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header de recherche */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-4">
              <Search size={24} className="text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Résultats pour "{query}"
              </h1>
            </div>
            
            {/* Statistiques */}
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>{filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}</span>
              {categories.length > 0 && (
                <span>{categories.length} catégorie{categories.length > 1 ? 's' : ''} trouvée{categories.length > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar des filtres */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Filter size={16} className="mr-2" />
                Filtres
              </h3>
              
              {/* Filtre par prix */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix (FCFA)
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Prix minimum"
                    value={filters.minPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Prix maximum"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Bouton de réinitialisation */}
              <button
                onClick={() => setFilters({ minPrice: '', maxPrice: '', category: '' })}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1">
            {/* Barre d'outils */}
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Tri */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="relevance">Pertinence</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                    <option value="newest">Plus récents</option>
                  </select>
                </div>

                {/* Mode d'affichage */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Grid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Catégories trouvées */}
            {categories.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Tag size={16} className="mr-2" />
                  Catégories
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/catalog/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Tag size={20} className="text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-gray-500 truncate">{category.description}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Produits trouvés */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package size={16} className="mr-2" />
                Produits
              </h2>
              
              {error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                  <p className="text-red-600">{error}</p>
                  <button
                    onClick={loadSearchResults}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Réessayer
                  </button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <Search size={48} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucun produit trouvé
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Essayez avec d'autres mots-clés ou modifiez vos filtres.
                  </p>
                  <Link
                    to="/catalog"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Voir tous les produits
                  </Link>
                </div>
              ) : (
                <div className={`grid gap-4 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  {filteredProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      showActions={true}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
