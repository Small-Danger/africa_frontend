import { Link } from 'react-router-dom';
import { ArrowRight, Package, Heart } from 'lucide-react';
import useFavorites from '../hooks/useFavorites';

const ProductCard = ({ product, showActions = true, className = '' }) => {
  const { isFavorite, toggleFavorite } = useFavorites();

  const safeGet = (obj, path, defaultValue = '') => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === '') return '0 FCFA';
    const numPrice = Number(price);
    if (Number.isNaN(numPrice)) return '0 FCFA';
    return `${Math.round(numPrice).toLocaleString('fr-FR')} FCFA`;
  };

  const getProductImage = () => {
    try {
      if (product?.images?.length > 0) {
        const firstImage = product.images[0];
        if (typeof firstImage === 'string' && firstImage.trim()) return firstImage;
      }
      if (product?.image_main?.trim()) return product.image_main;
      if (product?.category?.image_main) return product.category.image_main;
      return null;
    } catch {
      return null;
    }
  };

  const getMinPrice = () => {
    if (product?.min_price != null && !Number.isNaN(Number(product.min_price))) {
      return Number(product.min_price);
    }
    try {
      if (product?.variants?.length > 0) {
        const prices = product.variants
          .map((v) => Number(v?.price))
          .filter((p) => !Number.isNaN(p));
        if (prices.length) return Math.min(...prices);
      }
      const base = Number(product?.base_price ?? product?.price ?? 0);
      return Number.isNaN(base) ? 0 : base;
    } catch {
      return 0;
    }
  };

  const getOptionsLabel = () => {
    const count = Number(product?.variants_count ?? product?.variants?.length ?? 0);
    const hasVariants = Boolean(product?.has_variants) || count > 1;

    if (hasVariants && count > 1) return `${count} options`;
    if (hasVariants && count === 1) return '1 option';
    if (hasVariants) return 'Plusieurs options';
    return 'En stock';
  };

  if (!product?.id) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
        <div className="p-4 text-center text-gray-500 text-sm">Produit non disponible</div>
      </div>
    );
  }

  const productImage = getProductImage();
  const minPrice = getMinPrice();
  const productName = safeGet(product, 'name', 'Nom du produit');
  const productDescription = safeGet(product, 'description', '');
  const variantsCount = Number(product?.variants_count ?? product?.variants?.length ?? 0);
  const hasVariants = Boolean(product?.has_variants) || variantsCount > 1;
  const optionsLabel = getOptionsLabel();
  const isFav = isFavorite(product.id);
  const categoryName =
    product?.category?.parent?.name ||
    product?.category?.name ||
    null;

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className={`group block h-full touch-manipulation active:scale-[0.98] transition-transform ${className}`}
    >
      <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:border-brand-green/30 group-hover:-translate-y-1 h-full flex flex-col">
        <div className="relative aspect-square flex-shrink-0 overflow-hidden bg-brand-cream">
          {productImage ? (
            <img
              src={productImage}
              alt={productName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div
            className={`absolute inset-0 flex items-center justify-center bg-brand-green-light ${productImage ? 'hidden' : ''}`}
          >
            <Package size={36} className="text-brand-green/25" />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />

          {categoryName && (
            <span className="absolute top-2 left-2 max-w-[calc(100%-3rem)] truncate bg-white/95 backdrop-blur-sm text-[10px] font-semibold text-brand-green px-2 py-1 rounded-lg shadow-sm border border-brand-green/10">
              {categoryName}
            </span>
          )}

          {showActions && (
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`absolute top-2 right-2 w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all z-10 ${
                isFav
                  ? 'bg-red-50 border border-red-100 opacity-100 scale-100'
                  : 'bg-white/95 border border-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:scale-95 sm:group-hover:scale-100'
              }`}
              aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              aria-pressed={isFav}
            >
              <Heart
                size={15}
                className={`transition-colors ${
                  isFav ? 'fill-red-500 text-red-500' : 'text-gray-500 hover:text-red-500'
                }`}
              />
            </button>
          )}

          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2 pointer-events-none">
            <div className="bg-brand-green text-white rounded-xl px-2.5 py-1.5 shadow-md">
              {hasVariants && (
                <span className="block text-[9px] font-medium opacity-90 leading-none mb-0.5">
                  À partir de
                </span>
              )}
              <span className="text-xs sm:text-sm font-bold leading-none">{formatPrice(minPrice)}</span>
            </div>
            {showActions && (
              <span className="flex-shrink-0 w-8 h-8 bg-white/95 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300">
                <ArrowRight size={16} className="text-brand-green" />
              </span>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-3.5 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-brand-green transition-colors">
            {productName}
          </h3>

          {productDescription && (
            <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 leading-relaxed">
              {productDescription}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 mt-auto pt-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" aria-hidden />
              <span className="text-[11px] font-medium text-gray-600 truncate">{optionsLabel}</span>
            </div>

            {showActions && (
              <span className="flex-shrink-0 inline-flex items-center gap-0.5 text-[11px] font-bold text-brand-orange group-hover:text-brand-orange-dark transition-colors">
                Voir
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ProductCard;
