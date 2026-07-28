import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard';

/**
 * Version B — boutique épurée :
 * fil d'Ariane simple, catégories en chips, grille produits directe.
 */
const CatalogLayoutB = ({
  categories = [],
  products = [],
  totalCount = 0,
  hasMoreProducts = false,
  loadMoreProducts,
  loadingMore = false,
}) => {
  return (
    <div>
      <div className="flex justify-end mb-2">
        <span className="text-[10px] uppercase tracking-wider bg-brand-orange-light text-brand-orange-dark px-2.5 py-1 rounded-full font-semibold">
          Proposition B
        </span>
      </div>

      {/* Fil d'Ariane simple */}
      <nav className="text-sm text-gray-500 mb-4">
        <span className="text-gray-900 font-medium">Catalogue</span>
      </nav>

      {/* En-tête compact */}
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Notre boutique</h1>
        <p className="text-sm text-gray-500 mt-1">
          {totalCount > 0
            ? `${totalCount} produit${totalCount > 1 ? 's' : ''}`
            : 'Produits authentiques du Maroc 🇲🇦'}
        </p>
      </div>

      {/* Catégories en chips */}
      {categories.length > 0 && (
        <section className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Catégories
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/catalog/${category.slug}`}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:border-brand-green hover:text-brand-green transition-colors"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Grille produits */}
      {products.length > 0 ? (
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} showActions />
            ))}
          </div>

          {hasMoreProducts && (
            <div className="flex justify-center mt-8">
              <button
                type="button"
                onClick={loadMoreProducts}
                disabled={loadingMore}
                className="flex items-center px-6 py-3 bg-brand-orange text-white font-medium rounded-xl hover:bg-brand-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Chargement…
                  </>
                ) : (
                  'Voir plus de produits'
                )}
              </button>
            </div>
          )}
        </section>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-600">Catalogue en cours de préparation.</p>
        </div>
      )}
    </div>
  );
};

export default CatalogLayoutB;
