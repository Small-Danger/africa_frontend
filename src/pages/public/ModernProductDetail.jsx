import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Heart,
  Home,
  Package,
  MessageCircle,
  X,
  Minus,
  Plus,
} from 'lucide-react';
import { productService, cartService } from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import useFavorites from '../../hooks/useFavorites';
import ProductSuggestions from '../../components/ProductSuggestions';
import ProductPriceBadge from '../../components/ProductPriceBadge';
import { ShimmerTextVariants } from '../../components/ShimmerText';
import { generateWhatsAppLink } from '../../config/contact';
import { formatPrice } from '../../utils/productPrice';

const getProductImages = (product) => {
  if (!product) return [];
  const images = [];
  if (product.image_main?.trim()) images.push(product.image_main);
  if (Array.isArray(product.images)) {
    product.images.forEach((img) => {
      const url = typeof img === 'string' ? img : img?.media_path;
      if (url?.trim() && !images.includes(url)) images.push(url);
    });
  }
  return images.length ? images : [];
};

const getBreadcrumb = (product) => {
  const cat = product?.category;
  if (!cat) {
    return { backTo: '/catalog', backLabel: 'Catalogue', isSub: false };
  }
  if (cat.parent) {
    return {
      backTo: `/catalog/${cat.parent.slug}`,
      backLabel: cat.parent.name,
      parentSlug: cat.parent.slug,
      parentName: cat.parent.name,
      currentName: cat.name,
      currentSlug: cat.slug,
      isSub: true,
    };
  }
  return {
    backTo: '/catalog',
    backLabel: 'Catalogue',
    parentSlug: cat.slug,
    parentName: cat.name,
    isSub: false,
  };
};

const ProductDetailHeader = ({ product, breadcrumb }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
    <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-brand-green-light/40 to-brand-cream border-b border-gray-100">
      <Link
        to={breadcrumb.backTo}
        className="flex-shrink-0 inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-brand-green text-xs font-semibold hover:border-brand-green transition-colors shadow-sm"
      >
        <ChevronLeft size={16} strokeWidth={2.5} />
        <span className="max-w-[5rem] truncate sm:max-w-[8rem]">{breadcrumb.backLabel}</span>
      </Link>
      <nav className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto scrollbar-hide" aria-label="Fil d'Ariane">
        <Link
          to="/catalog"
          className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-gray-600 bg-white/80 hover:text-brand-green transition-colors"
        >
          <Home size={12} />
          <span>Catalogue</span>
        </Link>
        <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
        {breadcrumb.isSub ? (
          <>
            <Link
              to={`/catalog/${breadcrumb.parentSlug}`}
              className="flex-shrink-0 px-2 py-1 rounded-lg text-[11px] font-medium text-gray-600 hover:text-brand-green max-w-[7rem] truncate"
            >
              {breadcrumb.parentName}
            </Link>
            <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
            <span className="flex-shrink-0 px-2 py-1 rounded-lg text-[11px] font-semibold text-brand-green bg-brand-green-light max-w-[9rem] truncate">
              {breadcrumb.currentName}
            </span>
          </>
        ) : (
          <span className="flex-shrink-0 px-2 py-1 rounded-lg text-[11px] font-semibold text-brand-green bg-brand-green-light max-w-[10rem] truncate">
            {breadcrumb.parentName}
          </span>
        )}
      </nav>
    </div>
    <div className="px-4 py-3 md:hidden">
      <h1 className="text-lg font-bold text-gray-900 leading-snug line-clamp-2">{product?.name}</h1>
    </div>
    <div className="h-0.5 bg-gradient-to-r from-brand-green via-brand-orange to-brand-green" aria-hidden />
  </div>
);

const ModernProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, updateItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [cartSessionId, setCartSessionId] = useState(localStorage.getItem('cart_session_id'));

  const abortControllerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      if (!id || Number.isNaN(Number(id))) {
        setError('Produit introuvable');
        setLoading(false);
        return;
      }

      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);
        const response = await productService.getProduct(id);
        if (!isMounted) return;

        if (response.success && response.data) {
          const data = response.data;
          setProduct(data);
          const variants = (data.variants ?? []).filter((v) => v?.id && v.is_active !== false);
          if (variants.length) {
            const cheapest = [...variants].sort((a, b) => Number(a.price) - Number(b.price))[0];
            setSelectedVariant(cheapest);
          }
        } else {
          setError('Produit non trouvé');
        }
      } catch {
        if (isMounted) setError('Erreur lors du chargement');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProduct();
    return () => {
      isMounted = false;
      abortControllerRef.current?.abort();
    };
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    const variants = product.variants ?? [];
    if (variants.length > 0 && !selectedVariant) {
      setError('Veuillez choisir une option');
      return;
    }

    try {
      setAddingToCart(true);
      setError(null);

      const unitPrice = selectedVariant ? selectedVariant.price : product.base_price;
      const itemToAdd = {
        id: selectedVariant ? `${product.id}_${selectedVariant.id}` : product.id,
        product_id: product.id,
        variant_id: selectedVariant?.id,
        name: product.name,
        price: unitPrice,
        image: product.image_main,
        quantity,
      };

      addItem(itemToAdd);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);

      const cartData = selectedVariant
        ? { product_id: product.id, variant_id: selectedVariant.id, quantity }
        : { product_id: product.id, quantity };

      const headers = cartSessionId ? { 'X-Session-ID': cartSessionId } : {};

      cartService
        .addToCart(cartData, headers)
        .then((response) => {
          if (response?.success) {
            if (response.data?.session_id) {
              localStorage.setItem('cart_session_id', response.data.session_id);
              setCartSessionId(response.data.session_id);
            }
            if (response.data?.cart_item) {
              const apiItem = response.data.cart_item;
              updateItem(itemToAdd.id, {
                id: apiItem.id,
                product_id: apiItem.product?.id ?? apiItem.product_id,
                variant_id: apiItem.variant?.id ?? apiItem.variant_id,
                name: apiItem.product?.name ?? product.name,
                price: apiItem.unit_price ?? unitPrice,
                unit_price: apiItem.unit_price ?? unitPrice,
                image: apiItem.product?.image_main ?? product.image_main,
                quantity: apiItem.quantity ?? quantity,
                product: apiItem.product,
                variant: apiItem.variant,
              });
            }
          }
        })
        .catch(() => {});
    } catch (err) {
      setError(err.message ?? 'Erreur panier');
    } finally {
      setAddingToCart(false);
    }
  };

  const validVariants = (product?.variants ?? []).filter(
    (v) => v?.id && v.name && v.is_active !== false
  );
  const hasVariants = validVariants.length > 0;
  const hasMultipleVariants = validVariants.length > 1;
  const needsVariant = hasVariants && !selectedVariant;
  const unitPrice = selectedVariant?.price ?? product?.min_price ?? product?.base_price ?? 0;
  const totalPrice = unitPrice * quantity;
  const productImages = getProductImages(product);
  const breadcrumb = getBreadcrumb(product);
  const isFav = product ? isFavorite(product.id) : false;

  const nextImage = useCallback(() => {
    setCurrentImageIndex((i) => (i + 1) % productImages.length);
  }, [productImages.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((i) => (i - 1 + productImages.length) % productImages.length);
  }, [productImages.length]);

  if (loading) {
    return <ShimmerTextVariants.PageLoader subtitle="Chargement du produit..." />;
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{error}</h2>
          <Link to="/catalog" className="inline-block mt-4 px-6 py-3 bg-brand-green text-white rounded-xl font-medium">
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const AddToCartButton = ({ className = '', compact = false }) => (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={addingToCart || needsVariant}
      className={`flex items-center justify-center gap-2 bg-brand-orange text-white font-bold rounded-xl hover:bg-brand-orange-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-all active:scale-[0.98] ${className}`}
    >
      {addingToCart ? (
        <>
          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {!compact && <span>Ajout…</span>}
        </>
      ) : (
        <>
          <ShoppingCart size={compact ? 20 : 22} />
          <span className={compact ? 'text-sm' : ''}>
            {needsVariant ? 'Choisir une option' : `Ajouter · ${formatPrice(totalPrice)}`}
          </span>
        </>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-brand-cream pb-28 md:pb-10">
      {showSuccess && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-brand-green text-white px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Ajouté au panier</p>
            <button type="button" onClick={() => navigate('/cart')} className="text-xs underline opacity-90 mt-0.5">
              Voir le panier
            </button>
          </div>
          <button type="button" onClick={() => setShowSuccess(false)} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
        <ProductDetailHeader product={product} breadcrumb={breadcrumb} />

        <div className="grid md:grid-cols-2 gap-5 md:gap-8">
          {/* Galerie */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="relative aspect-square bg-brand-cream">
              {productImages.length > 0 ? (
                <img
                  src={productImages[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={48} className="text-brand-green/25" />
                </div>
              )}

              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/95 rounded-full shadow-md flex items-center justify-center"
                    aria-label="Image précédente"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/95 rounded-full shadow-md flex items-center justify-center"
                    aria-label="Image suivante"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <span className="absolute top-2 right-2 text-xs font-medium bg-black/60 text-white px-2 py-1 rounded-full">
                    {currentImageIndex + 1}/{productImages.length}
                  </span>
                </>
              )}

              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                className={`absolute top-2 left-2 w-9 h-9 rounded-full shadow-md flex items-center justify-center transition-colors ${
                  isFav ? 'bg-red-50 border border-red-100' : 'bg-white/95'
                }`}
                aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                aria-pressed={isFav}
              >
                <Heart size={18} className={isFav ? 'fill-red-500 text-red-500' : 'text-gray-500'} />
              </button>
            </div>

            {productImages.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
                {productImages.map((img, idx) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex ? 'border-brand-green ring-2 ring-brand-green/20' : 'border-gray-200'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Infos + achat */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
              <div className="hidden md:block mb-3">
                <span className="inline-flex items-center gap-1.5 bg-brand-green-light rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-brand-green uppercase tracking-wide">
                  🇲🇦 Produit authentique
                </span>
              </div>

              <h1 className="hidden md:block text-2xl font-bold text-gray-900 leading-snug mb-3">{product.name}</h1>

              <div className="mb-4">
                <ProductPriceBadge
                  product={product}
                  variant="inline"
                  price={unitPrice}
                  showFromPrefix={hasMultipleVariants && !selectedVariant}
                  selectedOptionLabel={selectedVariant?.name ?? null}
                />
                {quantity > 1 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Total pour {quantity} unité{quantity > 1 ? 's' : ''} :{' '}
                    <span className="font-semibold text-brand-green">{formatPrice(totalPrice)}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-gray-600 font-medium">En stock · Livraison AfrikRaga</span>
              </div>

              {product.description && (
                <div className="mb-5">
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">Description</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}

              {hasVariants && (
                <div className="mb-5">
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">
                    Choisir une option
                    <span className="text-gray-400 font-normal ml-1">({validVariants.length})</span>
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {validVariants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                          selectedVariant?.id === variant.id
                            ? 'border-brand-green bg-brand-green-light text-brand-green'
                            : 'border-gray-200 text-gray-700 hover:border-brand-green/40'
                        }`}
                      >
                        <span className="block">{variant.name}</span>
                        <span className="block text-xs mt-0.5 opacity-80">{formatPrice(variant.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">Quantité</h2>
                <p className="text-xs text-gray-500 mb-2">
                  Nombre d&apos;unités à commander
                  {selectedVariant?.name ? ` (${selectedVariant.name})` : hasVariants ? ' — choisissez d\'abord un format' : ''}
                </p>
                <div className="inline-flex items-center gap-3 bg-gray-50 rounded-xl p-1 border border-gray-100">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-brand-green transition-colors"
                    aria-label="Diminuer"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-brand-green transition-colors"
                    aria-label="Augmenter"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>
              )}

              <div className="hidden md:block">
                <AddToCartButton className="w-full py-4 text-base" />
              </div>
            </div>

            {/* Aide WhatsApp */}
            <div className="bg-brand-green-light/50 rounded-2xl border border-brand-green/10 p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900 text-sm">Une question sur ce produit ?</p>
                <p className="text-xs text-gray-600 mt-0.5">Notre équipe vous répond sur WhatsApp</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  window.open(
                    generateWhatsAppLink(`Bonjour ! J'ai une question sur le produit « ${product.name} ».`),
                    '_blank'
                  )
                }
                className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white text-sm font-medium rounded-xl hover:opacity-90"
              >
                <MessageCircle size={18} />
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <ProductSuggestions
            productId={id}
            categoryCatalogPath={
              product.category?.parent?.slug
                ? `/catalog/${product.category.parent.slug}/${product.category.slug}`
                : product.category?.slug
                  ? `/catalog/${product.category.slug}`
                  : '/catalog'
            }
          />
        </div>
      </div>

      {/* Barre fixe mobile */}
      <div className="md:hidden fixed bottom-[4.5rem] left-0 right-0 z-40 px-4 pb-2 pt-2 bg-gradient-to-t from-brand-cream via-brand-cream to-transparent">
        <AddToCartButton className="w-full py-3.5 text-sm shadow-lg" compact />
      </div>
    </div>
  );
};

export default ModernProductDetail;
