import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MessageCircle } from 'lucide-react';
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
 * Version C — hub boutique :
 * recherche, filtres catégorie/sous-catégorie, tri, grille paginée, CTA WhatsApp.
 */
const CatalogLayoutC = ({
  categories = [],
  products = [],
  categorySlug,
  subcategorySlug,
  currentCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
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

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
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
  }, [products, categorySlug, currentCategory, activeSubcategory, searchQuery, sortBy]);

  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [categorySlug, subcategorySlug, searchQuery, sortBy]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const filterLabel = activeSubcategory
    ? activeSubcategory.name
    : currentCategory
      ? currentCategory.name
      : null;

  const handleWhatsApp = () => {
    const context = filterLabel ? ` (catégorie : ${filterLabel})` : '';
    const message = `Bonjour ! Je ne trouve pas le produit que je cherche${context}. Pouvez-vous m'aider ?`;
    window.open(generateWhatsAppLink(message), '_blank');
  };

  return (
    <div>
      <div className="flex justify-end mb-2">
        <span className="text-[10px] uppercase tracking-wider bg-brand-orange-light text-brand-orange-dark px-2.5 py-1 rounded-full font-semibold">
          Proposition C
        </span>
      </div>

      {/* En-tête hub */}
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Boutique AfrikRaga</h1>
        <p className="text-sm text-gray-500 mt-1">
          {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}
          {filterLabel ? ` · ${filterLabel}` : ' · Tous'}
        </p>
      </div>

      {/* Recherche */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un produit…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
        />
      </div>

      {/* Filtres catégories */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide -mx-1 px-1">
          <Link
            to="/catalog"
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !categorySlug
                ? 'bg-brand-green text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-green hover:text-brand-green'
            }`}
          >
            Tous
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/catalog/${cat.slug}`}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                categorySlug === cat.slug
                  ? 'bg-brand-green text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-green hover:text-brand-green'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {/* Sous-catégories */}
      {currentCategory?.subcategories?.length > 0 && categorySlug && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-1 px-1">
          <Link
            to={`/catalog/${categorySlug}`}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !subcategorySlug
                ? 'bg-brand-orange text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-orange hover:text-brand-orange'
            }`}
          >
            Tous
          </Link>
          {currentCategory.subcategories.map((sub) => (
            <Link
              key={sub.id}
              to={`/catalog/${categorySlug}/${sub.slug}`}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                subcategorySlug === sub.slug
                  ? 'bg-brand-orange text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-orange hover:text-brand-orange'
              }`}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {/* Tri */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Résultats</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-green/30"
        >
          <option value="recent">Plus récents</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
          <option value="name">A – Z</option>
        </select>
      </div>

      {/* Grille produits */}
      {visibleProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? `Aucun résultat pour « ${searchQuery} »`
              : 'Aucun produit dans cette sélection.'}
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

      {/* CTA WhatsApp */}
      {visibleProducts.length > 0 && (
        <div className="mt-10 p-4 md:p-5 bg-brand-green-light/50 rounded-2xl border border-brand-green/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Besoin d&apos;un conseil ?</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Notre équipe vous guide pour choisir vos produits marocains.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              window.open(
                generateWhatsAppLink(
                  "Bonjour ! J'aimerais des conseils pour choisir vos produits marocains."
                ),
                '_blank'
              )
            }
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            <MessageCircle size={18} />
            WhatsApp
          </button>
        </div>
      )}
    </div>
  );
};

export default CatalogLayoutC;
