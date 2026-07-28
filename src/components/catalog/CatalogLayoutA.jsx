import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import ProductCard from '../ProductCard';
import ProductCarousel from '../ProductCarousel';

/**
 * Version A — même esprit que la page d'accueil :
 * catégories en scroll horizontal + produits en carrousel (mobile) / grille (desktop).
 */
const CatalogLayoutA = ({ categories = [], products = [] }) => {
  const carouselProducts = products.slice(0, 10);
  const gridProducts = products.slice(0, 8);

  return (
    <div>
      <div className="flex justify-end mb-2">
        <span className="text-[10px] uppercase tracking-wider bg-brand-orange-light text-brand-orange-dark px-2.5 py-1 rounded-full font-semibold">
          Proposition A
        </span>
      </div>
      {/* En-tête */}
      <div className="text-center mb-6 md:mb-8">
        <div className="inline-flex items-center gap-2 bg-brand-green-light rounded-full px-4 py-1.5 mb-3">
          <span>🇲🇦</span>
          <span className="text-sm font-semibold text-brand-green">Produits du Maroc</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Notre boutique
        </h1>
        <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto">
          Parcourez nos catégories et découvrez huiles, savons, épices et cosmétiques authentiques.
        </p>
      </div>

      {/* Catégories — scroll horizontal (comme l'accueil) */}
      {categories.length > 0 && (
        <section className="mb-8 md:mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Catégories</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/catalog/${category.slug}`}
                className="flex-shrink-0 w-36 sm:w-40 group"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all group-hover:shadow-md group-hover:border-brand-green/30">
                  <div className="h-28 sm:h-32 bg-brand-green-light flex items-center justify-center overflow-hidden">
                    {category.image_main ? (
                      <img
                        src={category.image_main}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Leaf size={32} className="text-brand-green/40" />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-brand-green transition-colors">
                      {category.name}
                    </h3>
                    {(category.subcategories?.length ?? 0) > 0 && (
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {category.subcategories.length} sous-cat.
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Produits — carrousel mobile / grille desktop */}
      {carouselProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-1 md:mb-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Tous nos produits</h2>
            <span className="text-xs text-gray-500">{products.length} article{products.length > 1 ? 's' : ''}</span>
          </div>

          <div className="md:hidden">
            <ProductCarousel
              products={carouselProducts}
              itemsPerSlide={2}
              autoPlay
              interval={3500}
              dotColor="bg-brand-green"
            />
          </div>

          <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-4">
            {gridProducts.map((product) => (
              <ProductCard key={product.id} product={product} showActions />
            ))}
          </div>

          {products.length > 8 && (
            <p className="hidden md:block text-center text-sm text-gray-500 mt-4">
              Sélectionnez une catégorie pour voir plus de produits
            </p>
          )}
        </section>
      )}

      {categories.length === 0 && products.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-600">Catalogue en cours de préparation.</p>
        </div>
      )}
    </div>
  );
};

export default CatalogLayoutA;
