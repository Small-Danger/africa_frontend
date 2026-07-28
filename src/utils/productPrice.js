/** Formate un montant en FCFA (sans décimales). */
export function formatPrice(price) {
  if (price === null || price === undefined || price === '') return '0 FCFA';
  const num = Number(price);
  if (Number.isNaN(num)) return '0 FCFA';
  return `${Math.round(num).toLocaleString('fr-FR')} FCFA`;
}

const normalizeVariants = (product) => {
  if (Array.isArray(product?.variants) && product.variants.length > 0) {
    return product.variants;
  }
  if (product?.variant?.name) {
    return [product.variant];
  }
  return [];
};

const getMinPrice = (product, variants) => {
  if (product?.min_price != null && !Number.isNaN(Number(product.min_price))) {
    return Number(product.min_price);
  }
  if (variants.length > 0) {
    const prices = variants.map((v) => Number(v?.price)).filter((p) => !Number.isNaN(p));
    if (prices.length) return Math.min(...prices);
  }
  const base = Number(product?.base_price ?? product?.price ?? 0);
  return Number.isNaN(base) ? 0 : base;
};

const getCheapestVariantName = (product, variants) => {
  const explicit = product?.min_price_label?.trim();
  if (explicit) return explicit;

  if (variants.length === 0) return null;

  const minPrice = getMinPrice(product, variants);
  const cheapest = variants.find((v) => Number(v?.price) === minPrice);
  if (cheapest?.name?.trim()) return cheapest.name.trim();

  const sorted = [...variants].sort((a, b) => Number(a?.price) - Number(b?.price));
  return sorted[0]?.name?.trim() || null;
};

/**
 * Infos d'affichage prix pour cartes, accueil, catalogue et suggestions.
 * Clarifie quel format/quantité correspond au prix affiché.
 */
export function getProductPriceInfo(product) {
  const variants = normalizeVariants(product);
  const variantsCount = Number(product?.variants_count ?? variants.length);
  const hasMultipleVariants =
    variantsCount > 1 || (Boolean(product?.has_variants) && variantsCount > 1);

  const minPrice = getMinPrice(product, variants);
  const optionLabel = getCheapestVariantName(product, variants);

  let availabilityLabel = 'En stock';
  if (hasMultipleVariants) {
    availabilityLabel = `${variantsCount} formats au choix`;
  } else if (optionLabel) {
    availabilityLabel = `Format : ${optionLabel}`;
  }

  return {
    minPrice,
    optionLabel,
    showFromPrefix: hasMultipleVariants,
    hasMultipleVariants,
    variantsCount,
    availabilityLabel,
    /** Sous-titre sous le prix sur les cartes */
    priceContextLabel: optionLabel
      ? hasMultipleVariants
        ? `format ${optionLabel}`
        : optionLabel
      : null,
  };
}
