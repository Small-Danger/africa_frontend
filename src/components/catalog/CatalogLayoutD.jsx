import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, LayoutGrid } from 'lucide-react';
import ProductCard from '../ProductCard';
import { generateWhatsAppLink } from '../../config/contact';

const PRODUCTS_PER_PAGE = 12;

const getProductPrice = (product) => {
  if (product?.variants?.length) {
    const prices = product.variants
      .map((v) => Number(v.price))
      .filter((p) => !Number.isNaN(p));
    if (prices.length) return Math.min(...prices);
  }
  const base = Number(product?.base_price ?? product?.price ?? 0);
  return Number.isNaN(base) ? 0 : base;
};

/**
 * Version D — détails UX :
 * sidebar catégories (desktop), sous-catégories scroll horizontal (mobile),
 * tri, compteur, état vide WhatsApp.
 */
const CatalogLayoutD = ({
  categories = [],
  products = [],
  categorySlug,
  subcategorySlug,
  currentCategory,
}) => {
  const [sortBy, setSortBy] = useState('recent');
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);

  const activeSubcategory = useMemo(() => {
    if (!subcategorySlug || !currentCategory?.subcategories) return null;
    return currentCategory.subcategories.find((sub) => sub.slug === subcategorySlug) ?? null;
  }, [subcategorySlug, currentCategory]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (categorySlug && currentCategory) {
      const catId = currentCategory.id;
      const subIds = currentCategory.subcategories?.map((s) => s.id) ?? [];

      if (activeSubcategory) {
        result = result.filter((p) => p.subcategory_id === activeSubcategory.id);
      } else {
        result = result.filter(
          (p) =>
            p.category_id === catId ||
            (p.subcategory_id && subIds.includes(p.subcategory_id))
        );
      }
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return getProductPrice(a) - getProductPrice(b);
        case 'price_desc':
          return getProductPrice(b) - getProductPrice(a);
        case 'name':
          return (a.name ?? '').localeCompare(b.name ?? '', 'fr');
        default:
          return 0;
      }
    });

    return result;
  }, [products, categorySlug, currentCategory, activeSubcategory, sortBy]);

  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [categorySlug, subcategorySlug, sortBy]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const filterLabel = activeSubcategory
    ? activeSubcategory.name
    : currentCategory
      ? currentCategory.name
      : 'Tous';

  const handleWhatsApp = () => {
    const message = `Bonjour ! Je ne trouve pas le produit que je cherche (${filterLabel}). Pouvez-vous m'aider ?`;
    window.open(generateWhatsAppLink(message), '_blank');
  };

  const sidebarLinkClass = (active) =>
    `block px-3 py-2 rounded-lg text-sm transition-colors ${
      active
        ? 'bg-brand-green text-white font-medium'
        : 'text-gray-700 hover:bg-brand-green-light hover:text-brand-green'
    }`;

  const subLinkClass = (active) =>
    `block px-3 py-1.5 rounded-lg text-xs transition-colors ${
      active
        ? 'bg-brand-orange text-white font-medium'
        : 'text-gray-500 hover:bg-brand-orange-light hover:text-brand-orange-dark'
    }`;

  return (
    <div>
      <div className="flex justify-end mb-2">
        <span className="text-[10px] uppercase tracking-wider bg-brand-orange-light text-brand-orange-dark px-2.5 py-1 rounded-full font-semibold">
          Proposition D
        </span>
      </div>

      {/* Mobile : catégories scroll horizontal */}
      <div className="md:hidden mb-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          <Link
            to="/catalog"
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium ${
              !categorySlug
                ? 'bg-brand-green text-white'
                : 'bg-white border border-gray-200 text-gray-700'
            }`}
          >
            Tous
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/catalog/${cat.slug}`}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium ${
                categorySlug === cat.slug
                  ? 'bg-brand-green text-white'
                  : 'bg-white border border-gray-200 text-gray-700'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile : sous-catégories scroll horizontal (style Netflix) */}
      {currentCategory?.subcategories?.length > 0 && categorySlug && (
        <div className="md:hidden mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            <Link
              to={`/catalog/${categorySlug}`}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${
                !subcategorySlug
                  ? 'bg-brand-orange text-white'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              Tous
            </Link>
            {currentCategory.subcategories.map((sub) => (
              <Link
                key={sub.id}
                to={`/catalog/${categorySlug}/${sub.slug}`}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  subcategorySlug === sub.slug
                    ? 'bg-brand-orange text-white'
                    : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-6 lg:gap-8">
        {/* Desktop : sidebar catégories fixe */}
        <aside className="hidden md:block w-52 lg:w-56 flex-shrink-0">
          <div className="sticky top-20 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <LayoutGrid size={18} className="text-brand-green" />
              <span className="font-bold text-gray-900 text-sm">Catégories</span>
            </div>
            <nav className="space-y-1">
              <Link to="/catalog" className={sidebarLinkClass(!categorySlug)}>
                Tous les produits
              </Link>
              {categories.map((cat) => (
                <div key={cat.id}>
                  <Link
                    to={`/catalog/${cat.slug}`}
                    className={sidebarLinkClass(categorySlug === cat.slug && !subcategorySlug)}
                  >
                    {cat.name}
                  </Link>
                  {categorySlug === cat.slug && cat.subcategories?.length > 0 && (
                    <div className="ml-2 mt-1 space-y-0.5 border-l-2 border-brand-orange/20 pl-2">
                      <Link
                        to={`/catalog/${cat.slug}`}
                        className={subLinkClass(!subcategorySlug)}
                      >
                        Tous
                      </Link>
                      {cat.subcategories.map((sub) => (
                        <Link
                          key={sub.id}
                          to={`/catalog/${cat.slug}/${sub.slug}`}
                          className={subLinkClass(subcategorySlug === sub.slug)}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Zone produits */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Catalogue</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} · {filterLabel}
              </p>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-green/30 w-full sm:w-auto"
            >
              <option value="recent">Plus récents</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="name">A – Z</option>
            </select>
          </div>

          {visibleProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} showActions />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + PRODUCTS_PER_PAGE)}
                    className="px-6 py-3 bg-brand-orange text-white font-medium rounded-xl hover:bg-brand-orange-dark transition-colors"
                  >
                    Voir plus de produits
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 bg-brand-green-light rounded-full flex items-center justify-center mx-auto mb-4">
                <LayoutGrid size={28} className="text-brand-green/50" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun produit trouvé</h3>
              <p className="text-gray-600 text-sm mb-6 max-w-xs mx-auto">
                Cette sélection est vide pour le moment. Contactez-nous, nous vous orienterons.
              </p>
              <button
                type="button"
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                <MessageCircle size={18} />
                Je ne trouve pas mon produit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogLayoutD;
