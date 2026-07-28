import { formatPrice, getProductPriceInfo } from '../utils/productPrice';

/**
 * Badge prix réutilisable (cartes produit, carrousels, catalogue).
 * variant="overlay" : badge vert sur l'image · variant="inline" : bloc page produit
 */
const ProductPriceBadge = ({
  product,
  variant = 'overlay',
  selectedOptionLabel = null,
  showFromPrefix: showFromPrefixOverride = null,
  price: priceOverride = null,
  className = '',
}) => {
  const info = getProductPriceInfo(product);
  const amount = priceOverride ?? info.minPrice;
  const showFromPrefix = showFromPrefixOverride ?? info.showFromPrefix;
  const contextLabel = selectedOptionLabel ?? info.priceContextLabel;

  if (variant === 'inline') {
    return (
      <div className={`inline-flex flex-col bg-brand-green text-white rounded-xl px-4 py-2.5 shadow-sm ${className}`}>
        {showFromPrefix && !selectedOptionLabel && (
          <span className="text-[10px] font-medium opacity-90">À partir de</span>
        )}
        <span className="text-2xl md:text-3xl font-bold leading-none whitespace-nowrap">
          {formatPrice(amount)}
        </span>
        {contextLabel && (
          <span className="text-xs opacity-90 mt-1 leading-snug">
            {selectedOptionLabel ? `Format : ${selectedOptionLabel}` : `dès le ${contextLabel}`}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-brand-green text-white rounded-xl px-2.5 py-1.5 shadow-md max-w-[calc(100%-0.5rem)] ${className}`}
    >
      {showFromPrefix && (
        <span className="block text-[9px] font-medium opacity-90 leading-none mb-0.5">À partir de</span>
      )}
      <span className="block text-xs sm:text-sm font-bold leading-none whitespace-nowrap">
        {formatPrice(amount)}
      </span>
      {contextLabel && (
        <span className="block text-[9px] font-medium opacity-90 leading-tight mt-0.5 truncate">
          {showFromPrefix ? contextLabel : contextLabel}
        </span>
      )}
    </div>
  );
};

export default ProductPriceBadge;
