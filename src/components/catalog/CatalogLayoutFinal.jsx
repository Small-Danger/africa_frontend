import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Package, MessageCircle, LayoutGrid, Home } from 'lucide-react';
import ProductCard from '../ProductCard';
import { generateWhatsAppLink } from '../../config/contact';

/** Nombre total de produits d'une catégorie (directs + sous-catégories) */
export const getCategoryTotalProducts = (category) => {
  if (!category) return 0;
  const subTotal = (category.subcategories ?? []).reduce(
    (sum, sub) => sum + (sub.products_count || 0),
    0
  );
  return subTotal + (category.products_count || 0);
};

/** Bulle image + titre pour une sous-catégorie (ou « Tous ») */
const SubcategoryBubble = ({ to, image, label, count, isActive, fallbackIcon: FallbackIcon = Package }) => (
  <Link
    to={to}
    className="flex-shrink-0 flex flex-col items-center w-[4.75rem] sm:w-[5.25rem] group touch-manipulation"
  >
    <div
      className={`relative w-[4.25rem] h-[4.25rem] sm:w-[4.75rem] sm:h-[4.75rem] rounded-full overflow-hidden bg-brand-green-light transition-all duration-200 ${
        isActive
          ? 'ring-[3px] ring-brand-green ring-offset-2 shadow-md scale-105'
          : 'ring-2 ring-gray-100 group-hover:ring-brand-green/40 group-active:scale-95'
      }`}
    >
      {image ? (
        <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <FallbackIcon size={28} className="text-brand-green/35" />
        </div>
      )}
      {count != null && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
            isActive ? 'bg-brand-orange text-white' : 'bg-white text-gray-700 shadow-sm border border-gray-100'
          }`}
        >
          {count}
        </span>
      )}
    </div>
    <p
      className={`mt-2 text-[10px] sm:text-[11px] text-center leading-tight line-clamp-2 w-full px-0.5 ${
        isActive ? 'font-semibold text-brand-green' : 'text-gray-600 group-hover:text-brand-green'
      }`}
    >
      {label}
    </p>
  </Link>
);

/** Rangée de bulles sous-catégories — scroll horizontal, rien n'est coupé hors écran sans pouvoir défiler */
const SubcategoryBubbleNav = ({ categorySlug, currentCategory, subcategorySlug }) => {
  const subcategories = currentCategory?.subcategories ?? [];
  const totalAll = getCategoryTotalProducts(currentCategory);

  return (
    <div className="mb-6 -mx-4 px-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Affiner par sous-catégorie
        </p>
        {subcategories.length > 4 && (
          <span className="text-[10px] text-gray-400 md:hidden">Glissez →</span>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-6 w-6 bg-gradient-to-r from-brand-cream to-transparent pointer-events-none z-10 md:hidden" />
        <div className="absolute right-0 top-0 bottom-6 w-6 bg-gradient-to-l from-brand-cream to-transparent pointer-events-none z-10 md:hidden" />

        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          <div className="snap-start">
            <SubcategoryBubble
              to={`/catalog/${categorySlug}`}
              image={currentCategory?.image_main}
              label="Tous"
              count={totalAll}
              isActive={!subcategorySlug}
              fallbackIcon={LayoutGrid}
            />
          </div>
          {subcategories.map((sub) => (
            <div key={sub.id} className="snap-start">
              <SubcategoryBubble
                to={`/catalog/${categorySlug}/${sub.slug}`}
                image={sub.image_main}
                label={sub.name}
                count={sub.products_count ?? 0}
                isActive={subcategorySlug === sub.slug}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/** Carte catégorie — page racine /catalog */
const CategoryCard = ({ category }) => {
  const count = getCategoryTotalProducts(category);
  const subCount = category.subcategories?.length ?? 0;

  const subcategoryLabel =
    subCount === 0
      ? null
      : subCount === 1
        ? '1 sous-catégorie'
        : `${subCount} sous-catégories`;

  return (
    <Link
      to={`/catalog/${category.slug}`}
      className="group block h-full touch-manipulation active:scale-[0.98] transition-transform"
    >
      <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:shadow-lg group-hover:border-brand-green/30 group-hover:-translate-y-1">
        <div className="relative aspect-[4/3] flex-shrink-0 overflow-hidden bg-brand-green-light">
          {category.image_main ? (
            <img
              src={category.image_main}
              alt={category.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={44} className="text-brand-green/25" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between gap-2">
            <span className="bg-brand-green text-white rounded-xl px-2.5 py-1.5 shadow-md">
              <span className="text-sm font-bold leading-none">{count}</span>
              <span className="text-[10px] font-medium ml-1 opacity-90">
                produit{count !== 1 ? 's' : ''}
              </span>
            </span>
            <span className="w-8 h-8 bg-white/95 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight size={18} className="text-brand-green" />
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h2 className="font-bold text-gray-900 text-base leading-snug group-hover:text-brand-green transition-colors line-clamp-2">
            {category.name}
          </h2>

          {category.description && (
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed flex-1">
              {category.description}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
            {subcategoryLabel ? (
              <span className="text-[11px] font-medium text-gray-600 bg-brand-green-light/60 text-brand-green-dark px-2.5 py-1 rounded-lg">
                {subcategoryLabel}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
                Produits disponibles
              </span>
            )}
            <span className="text-[11px] font-bold text-brand-orange group-hover:text-brand-orange-dark inline-flex items-center gap-0.5 flex-shrink-0">
              Voir les produits
              <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>

        <div className="h-0.5 bg-gradient-to-r from-brand-green/0 via-brand-green/40 to-brand-orange/40 group-hover:from-brand-green group-hover:via-brand-orange group-hover:to-brand-green transition-all duration-300" />
      </article>
    </Link>
  );
};

/** Carte en-tête page racine /catalog */
const CatalogRootHeaderCard = ({ categories = [] }) => {
  const totalCategories = categories.length;
  const totalProducts = categories.reduce((sum, cat) => sum + getCategoryTotalProducts(cat), 0);

  return (
    <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-5 md:px-6 md:py-6">
        <div className="text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-brand-green-light rounded-full px-4 py-1.5 mb-3">
            <span>🇲🇦</span>
            <span className="text-sm font-semibold text-brand-green">Produits du Maroc</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            Choisissez une catégorie
          </h1>
          <p className="text-sm text-gray-600 max-w-lg mx-auto md:mx-0">
            Sélectionnez une catégorie pour voir tous les produits disponibles.
          </p>
          {totalCategories > 0 && (
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
              <span className="inline-flex items-center bg-brand-green text-white px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm">
                {totalCategories} catégorie{totalCategories > 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center bg-brand-orange-light text-brand-orange-dark px-3 py-1.5 rounded-xl text-sm font-semibold">
                {totalProducts} produit{totalProducts !== 1 ? 's' : ''} au total
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-brand-green via-brand-orange to-brand-green" aria-hidden />
    </div>
  );
};

/** Carte en-tête unifiée : retour, fil d'Ariane cliquable, titre vendeur */
const CatalogHeaderCard = ({
  categorySlug,
  currentCategory,
  activeSub,
  subcategorySlug,
  pageTitle,
  totalLabel,
  products,
}) => {
  const backTo = subcategorySlug ? `/catalog/${categorySlug}` : '/catalog';
  const backLabel = subcategorySlug ? currentCategory?.name ?? 'Catégorie' : 'Catalogue';

  const heroImage = activeSub?.image_main || currentCategory?.image_main;
  const heroDescription = activeSub?.description || (!activeSub && currentCategory?.description);

  return (
    <div className="mb-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-brand-green-light/40 to-brand-cream border-b border-gray-100">
        <Link
          to={backTo}
          className="flex-shrink-0 inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-brand-green text-xs font-semibold hover:border-brand-green hover:bg-brand-green-light/30 transition-colors shadow-sm"
          aria-label={`Retour à ${backLabel}`}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
          <span className="max-w-[4.5rem] truncate sm:max-w-[8rem]">{backLabel}</span>
        </Link>

        <nav
          className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto scrollbar-hide"
          aria-label="Fil d'Ariane"
        >
          <Link
            to="/catalog"
            className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-gray-600 bg-white/80 hover:text-brand-green hover:border-brand-green/30 border border-transparent transition-colors"
          >
            <Home size={12} className="opacity-70" />
            <span>Catalogue</span>
          </Link>
          <ChevronRight size={12} className="flex-shrink-0 text-gray-300" aria-hidden />
          {activeSub ? (
            <>
              <Link
                to={`/catalog/${categorySlug}`}
                className="flex-shrink-0 px-2 py-1 rounded-lg text-[11px] font-medium text-gray-600 bg-white/80 hover:text-brand-green transition-colors max-w-[7rem] truncate"
                title={currentCategory?.name}
              >
                {currentCategory?.name}
              </Link>
              <ChevronRight size={12} className="flex-shrink-0 text-gray-300" aria-hidden />
              <span
                className="flex-shrink-0 px-2 py-1 rounded-lg text-[11px] font-semibold text-brand-green bg-brand-green-light border border-brand-green/20 max-w-[9rem] sm:max-w-[12rem] truncate"
                title={activeSub.name}
              >
                {activeSub.name}
              </span>
            </>
          ) : (
            <span className="flex-shrink-0 px-2 py-1 rounded-lg text-[11px] font-semibold text-brand-green bg-brand-green-light border border-brand-green/20 max-w-[10rem] sm:max-w-none truncate">
              {currentCategory?.name}
            </span>
          )}
        </nav>
      </div>

      <div className="flex gap-4 p-4 md:p-5">
        {heroImage ? (
          <div className="w-[4.5rem] h-[4.5rem] md:w-24 md:h-24 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-brand-green/10 shadow-inner bg-brand-green-light">
            <img src={heroImage} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-[4.5rem] h-[4.5rem] md:w-24 md:h-24 rounded-2xl flex-shrink-0 bg-brand-green-light flex items-center justify-center ring-2 ring-brand-green/10">
            <Package size={32} className="text-brand-green/30" />
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="inline-flex self-start items-center gap-1.5 bg-brand-green-light rounded-full px-2.5 py-0.5 mb-2">
            <span className="text-xs leading-none">🇲🇦</span>
            <span className="text-[10px] font-semibold text-brand-green uppercase tracking-wide">
              Produit authentique
            </span>
          </div>
          <h1 className="text-lg md:text-2xl font-bold text-gray-900 leading-snug">{pageTitle}</h1>
          {heroDescription && (
            <p className="text-xs md:text-sm text-gray-500 mt-1.5 line-clamp-2">{heroDescription}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 bg-brand-orange-light text-brand-orange-dark px-3 py-1.5 rounded-xl text-sm font-bold">
              <span className="text-lg leading-none text-brand-orange">{totalLabel}</span>
              <span className="font-medium text-brand-orange-dark/90">
                produit{totalLabel !== 1 ? 's' : ''} disponible{totalLabel !== 1 ? 's' : ''}
              </span>
            </span>
            {products.length < totalLabel && (
              <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                {products.length} affiché{products.length !== 1 ? 's' : ''} sur {totalLabel}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-brand-green via-brand-orange to-brand-green" aria-hidden />
    </div>
  );
};

/**
 * Catalogue orienté client :
 * - /catalog → choix clair de la catégorie
 * - /catalog/:cat → tous les produits de la catégorie + filtres sous-catégories
 * - /catalog/:cat/:sub → produits de la sous-catégorie
 */
const CatalogLayoutFinal = ({
  categories = [],
  products = [],
  categorySlug,
  subcategorySlug,
  currentCategory,
  pagination = { total: 0, current_page: 1, last_page: 1 },
  totalLoaded = 0,
  loadingMore = false,
  onLoadMore,
  hasMoreToShow = false,
}) => {
  const activeSub = subcategorySlug
    ? currentCategory?.subcategories?.find((s) => s.slug === subcategorySlug)
    : null;

  const subcategories = currentCategory?.subcategories ?? [];
  const hasSubcategories = subcategories.length > 0;

  const pageTitle = activeSub?.name ?? currentCategory?.name ?? 'Nos catégories';
  const totalLabel = totalLoaded || pagination.total || products.length;

  const handleWhatsApp = () => {
    const ctx = activeSub?.name ?? currentCategory?.name ?? 'catalogue';
    window.open(
      generateWhatsAppLink(`Bonjour ! Je cherche un produit dans la catégorie « ${ctx} ». Pouvez-vous m'aider ?`),
      '_blank'
    );
  };

  // ── Page racine : uniquement les catégories ──
  if (!categorySlug) {
    return (
      <div>
        <CatalogRootHeaderCard categories={categories} />

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-600">Catalogue en cours de préparation.</p>
          </div>
        )}
      </div>
    );
  }

  // ── Page catégorie / sous-catégorie ──
  return (
    <div>
      <CatalogHeaderCard
        categorySlug={categorySlug}
        currentCategory={currentCategory}
        activeSub={activeSub}
        subcategorySlug={subcategorySlug}
        pageTitle={pageTitle}
        totalLabel={totalLabel}
        products={products}
      />

      {/* Filtres sous-catégories — bulles image + titre */}
      {hasSubcategories && (
        <SubcategoryBubbleNav
          categorySlug={categorySlug}
          currentCategory={currentCategory}
          subcategorySlug={subcategorySlug}
        />
      )}

      {/* Grille produits */}
      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} showActions />
            ))}
          </div>

          {hasMoreToShow && (
            <div className="flex flex-col items-center gap-2 mt-8">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="px-6 py-3 bg-brand-orange text-white font-medium rounded-xl hover:bg-brand-orange-dark transition-colors disabled:opacity-50"
              >
                {loadingMore
                  ? 'Chargement…'
                  : `Afficher plus (${products.length}/${totalLabel})`}
              </button>
            </div>
          )}

          {!hasMoreToShow && totalLabel > 0 && products.length > 0 && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Tous les {totalLabel} produits sont affichés.
            </p>
          )}
        </>
      ) : (
        <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
          <Package size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Aucun produit pour le moment</h3>
          <p className="text-sm text-gray-500 mb-5">
            {hasSubcategories && !subcategorySlug
              ? 'Sélectionnez une sous-catégorie ci-dessus ou contactez-nous.'
              : 'Revenez bientôt ou contactez-nous directement.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {hasSubcategories && subcategorySlug && (
              <Link
                to={`/catalog/${categorySlug}`}
                className="px-5 py-2.5 bg-brand-green text-white text-sm font-medium rounded-xl hover:bg-brand-green-dark"
              >
                Voir toute la catégorie
              </Link>
            )}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366] text-white text-sm font-medium rounded-xl hover:opacity-90"
            >
              <MessageCircle size={18} />
              Nous contacter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogLayoutFinal;
