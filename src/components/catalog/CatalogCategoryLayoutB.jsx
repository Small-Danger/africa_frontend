import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard';

/**
 * Version B — page catégorie / sous-catégorie épurée :
 * fil d'Ariane une ligne, hero compact, chips sous-catégories, grille produits.
 */
const CatalogCategoryLayoutB = ({
  categorySlug,
  subcategorySlug,
  currentCategory,
  displayedProducts = [],
  hasMoreProducts = false,
  loadMoreProducts,
  loadingMore = false,
}) => {
  if (!currentCategory) return null;

  const subcategories = currentCategory.subcategories ?? [];
  const activeSub = subcategorySlug
    ? subcategories.find((sub) => sub.slug === subcategorySlug)
    : null;

  const pageTitle = activeSub?.name ?? currentCategory.name;
  const pageDescription = activeSub?.description ?? currentCategory.description;
  const heroImage = activeSub?.image_main ?? currentCategory.image_main;

  const showSubcategoryChips = subcategories.length > 0;

  return (
    <div>
      <div className="flex justify-end mb-2">
        <span className="text-[10px] uppercase tracking-wider bg-brand-orange-light text-brand-orange-dark px-2.5 py-1 rounded-full font-semibold">
          Proposition B
        </span>
      </div>

      {/* Fil d'Ariane — une ligne */}
      <nav className="text-sm text-gray-500 mb-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <Link to="/catalog" className="hover:text-brand-green transition-colors">
          Catalogue
        </Link>
        <span className="mx-1.5 text-gray-300">›</span>
        {subcategorySlug ? (
          <>
            <Link
              to={`/catalog/${categorySlug}`}
              className="hover:text-brand-green transition-colors"
            >
              {currentCategory.name}
            </Link>
            <span className="mx-1.5 text-gray-300">›</span>
            <span className="text-gray-900 font-medium">{activeSub?.name}</span>
          </>
        ) : (
          <span className="text-gray-900 font-medium">{currentCategory.name}</span>
        )}
      </nav>

      {/* Hero compact */}
      <div className="relative h-32 md:h-36 rounded-xl overflow-hidden mb-5 bg-brand-green-light">
        {heroImage && (
          <img
            src={heroImage}
            alt={pageTitle}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h1 className="text-xl md:text-2xl font-bold text-white">{pageTitle}</h1>
          {pageDescription && (
            <p className="text-white/85 text-xs md:text-sm mt-0.5 line-clamp-1">
              {pageDescription}
            </p>
          )}
        </div>
      </div>

      {/* Sous-catégories en chips */}
      {showSubcategoryChips && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide -mx-1 px-1">
          <Link
            to={`/catalog/${categorySlug}`}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !subcategorySlug
                ? 'bg-brand-green text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-green hover:text-brand-green'
            }`}
          >
            Tous
          </Link>
          {subcategories.map((sub) => (
            <Link
              key={sub.id}
              to={`/catalog/${categorySlug}/${sub.slug}`}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                subcategorySlug === sub.slug
                  ? 'bg-brand-green text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-green hover:text-brand-green'
              }`}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {/* Produits */}
      {displayedProducts.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {subcategorySlug
                ? 'Produits'
                : subcategories.length > 0
                  ? 'Produits directs'
                  : 'Produits'}
            </h2>
            <span className="text-xs text-gray-500">
              {displayedProducts.length} produit{displayedProducts.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {displayedProducts.map((product) => (
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
        !showSubcategoryChips && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun produit disponible</h3>
            <p className="text-gray-600 mb-6 text-sm">
              Cette catégorie ne contient pas encore de produits.
            </p>
            <Link
              to="/catalog"
              className="inline-flex items-center px-5 py-2.5 bg-brand-green text-white text-sm font-medium rounded-xl hover:bg-brand-green-dark transition-colors"
            >
              Retour au catalogue
            </Link>
          </div>
        )
      )}
    </div>
  );
};

export default CatalogCategoryLayoutB;
