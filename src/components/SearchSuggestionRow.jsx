import { useState } from 'react';
import { Package, Tag, ArrowRight } from 'lucide-react';
import { formatPrice, getProductPriceInfo } from '../utils/productPrice';

const SuggestionThumb = ({ image, type, className = 'w-11 h-11' }) => {
  const [failed, setFailed] = useState(false);
  const showImage = image?.trim() && !failed;

  return (
    <div
      className={`${className} rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm ${
        type === 'product' ? 'bg-brand-cream' : 'bg-brand-orange-light'
      }`}
    >
      {showImage ? (
        <img
          src={image}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {type === 'product' ? (
            <Package size={18} className="text-brand-green/40" />
          ) : (
            <Tag size={18} className="text-brand-orange/60" />
          )}
        </div>
      )}
    </div>
  );
};

const SuggestionPrice = ({ result }) => {
  if (result.type !== 'product' || result.price == null) return null;

  const info = getProductPriceInfo({
    min_price: result.min_price ?? result.price,
    min_price_label: result.min_price_label,
    has_variants: result.has_variants,
    variants_count: result.variants_count,
  });

  return (
    <div className="mt-0.5">
      <p className="text-xs text-brand-green font-semibold leading-tight">
        {info.showFromPrefix && (
          <span className="text-gray-500 font-normal">À partir de </span>
        )}
        {formatPrice(info.minPrice)}
      </p>
      {info.priceContextLabel && (
        <p className="text-[10px] text-gray-500 truncate leading-tight mt-0.5">
          {info.priceContextLabel}
        </p>
      )}
    </div>
  );
};

/**
 * Ligne de suggestion recherche — miniature, nom, prix + format.
 */
const SearchSuggestionRow = ({
  result,
  onClick,
  onMouseDown,
  showArrow = false,
  compact = false,
  className = '',
}) => (
  <button
    type="button"
    onMouseDown={onMouseDown}
    onClick={onClick}
    className={`w-full flex items-center gap-3 text-left transition-colors ${
      compact ? 'p-2.5 rounded-lg hover:bg-brand-green-light' : 'p-3 rounded-xl bg-brand-cream border border-gray-100 active:bg-brand-green-light md:bg-transparent md:border-0 md:hover:bg-brand-green-light'
    } ${className}`}
  >
    <SuggestionThumb
      image={result.image}
      type={result.type}
      className={compact ? 'w-9 h-9 rounded-lg' : 'w-11 h-11'}
    />
    <div className="flex-1 min-w-0">
      <p className={`font-semibold text-gray-900 truncate ${compact ? 'text-sm' : 'text-sm md:text-base'}`}>
        {result.name}
      </p>
      {result.type === 'product' ? (
        <SuggestionPrice result={result} />
      ) : (
        <p className="text-[10px] text-gray-500 mt-0.5 truncate">
          {result.description ? result.description : 'Catégorie'}
        </p>
      )}
      {result.type === 'product' && result.category && !compact && (
        <p className="text-[10px] text-gray-400 truncate mt-0.5 hidden sm:block">{result.category}</p>
      )}
    </div>
    {showArrow && <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />}
  </button>
);

export default SearchSuggestionRow;
