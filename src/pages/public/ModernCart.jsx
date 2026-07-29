import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ChevronLeft,
  Home,
  ChevronRight,
  MessageCircle,
  CheckCircle,
  X,
  Package,
  Truck,
  Shield,
  ShoppingCart,
} from 'lucide-react';
import { cartService, orderService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import CartSuggestions from '../../components/CartSuggestions';
import { generateWhatsAppLink } from '../../config/contact';

const formatPriceDisplay = (price) => {
  if (price === null || price === undefined || price === '') return '0 FCFA';
  const numPrice = Number(price);
  if (Number.isNaN(numPrice)) return '0 FCFA';
  return `${Math.round(numPrice).toLocaleString('fr-FR')} FCFA`;
};

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop';

const CartPageHeader = ({ itemCount, totalItems, totalPrice }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
    <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-brand-green-light/40 to-brand-cream border-b border-gray-100">
      <Link
        to="/catalog"
        className="flex-shrink-0 inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-brand-green text-xs font-semibold hover:border-brand-green transition-colors shadow-sm"
      >
        <ChevronLeft size={16} strokeWidth={2.5} />
        <span>Catalogue</span>
      </Link>
      <nav className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto scrollbar-hide" aria-label="Fil d'Ariane">
        <Link
          to="/"
          className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-gray-600 bg-white/80 hover:text-brand-green transition-colors"
        >
          <Home size={12} />
          <span>Accueil</span>
        </Link>
        <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
        <span className="flex-shrink-0 px-2 py-1 rounded-lg text-[11px] font-semibold text-brand-green bg-brand-green-light">
          Panier
        </span>
      </nav>
    </div>
    <div className="px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-lg md:text-xl font-bold text-gray-900">Mon panier</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {itemCount} article{itemCount > 1 ? 's' : ''} · {totalItems} unité{totalItems > 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Total</p>
        <p className="text-lg md:text-xl font-bold text-brand-green">{formatPriceDisplay(totalPrice)}</p>
      </div>
    </div>
    <div className="h-0.5 bg-gradient-to-r from-brand-green via-brand-orange to-brand-green" aria-hidden />
  </div>
);

const QuantityControl = ({ quantity, onDecrease, onIncrease, size = 'md' }) => {
  const btnClass = size === 'sm' ? 'w-9 h-9' : 'w-10 h-10 md:w-11 md:h-11';
  const textClass = size === 'sm' ? 'w-10 text-sm' : 'w-11 md:w-12 text-base';

  return (
    <div className="inline-flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={onDecrease}
        disabled={quantity <= 1}
        className={`${btnClass} flex items-center justify-center hover:bg-brand-cream disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-brand-green`}
        aria-label="Diminuer la quantité"
      >
        <Minus size={size === 'sm' ? 14 : 16} />
      </button>
      <span className={`${textClass} text-center font-bold text-gray-900 border-x-2 border-gray-200 py-2 bg-brand-cream/50`}>
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        className={`${btnClass} flex items-center justify-center hover:bg-brand-cream transition-colors text-brand-green`}
        aria-label="Augmenter la quantité"
      >
        <Plus size={size === 'sm' ? 14 : 16} />
      </button>
    </div>
  );
};

const CartLineItem = ({ item, onUpdateQuantity, onRemove }) => {
  const unitPrice = item.unit_price ?? item.price ?? 0;
  const lineTotal = unitPrice * (item.quantity || 1);

  return (
    <article className="p-4 md:p-5 hover:bg-brand-cream/30 transition-colors">
      <div className="flex gap-3 md:gap-4">
        <Link
          to={`/products/${item.product_id}`}
          className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-brand-cream border border-gray-100 hover:border-brand-green/30 transition-colors"
        >
          <img
            src={item.product?.image_main || item.image || PLACEHOLDER_IMAGE}
            alt={item.product?.name || 'Produit'}
            className="w-full h-full object-cover"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                to={`/products/${item.product_id}`}
                className="text-sm md:text-base font-bold text-gray-900 hover:text-brand-green transition-colors line-clamp-2"
              >
                {item.product?.name || item.name || 'Produit'}
              </Link>
              {item.variant?.name && (
                <span className="inline-flex mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-green-light text-brand-green border border-brand-green/15">
                  {item.variant.name}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer"
              aria-label="Supprimer cet article"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Prix unitaire</p>
              <p className="text-sm font-bold text-brand-green">{formatPriceDisplay(unitPrice)}</p>
            </div>
            <QuantityControl
              quantity={item.quantity}
              onDecrease={() => onUpdateQuantity(item.id, item.quantity - 1)}
              onIncrease={() => onUpdateQuantity(item.id, item.quantity + 1)}
            />
            <div className="text-right ml-auto md:ml-0">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Sous-total</p>
              <p className="text-base md:text-lg font-bold text-gray-900">{formatPriceDisplay(lineTotal)}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

const OrderSummaryCard = ({
  totalItems,
  totalPrice,
  creatingOrder,
  onCheckout,
  onClearCart,
  showClearButton,
  className = '',
}) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
    <div className="px-4 py-4 md:px-5 border-b border-gray-100 bg-gradient-to-r from-brand-green-light/20 to-white">
      <h2 className="text-base md:text-lg font-bold text-gray-900">Résumé</h2>
      <p className="text-xs text-gray-500 mt-0.5">{totalItems} article{totalItems > 1 ? 's' : ''} au total</p>
    </div>

    <div className="p-4 md:p-5 space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Sous-total</span>
        <span className="font-semibold text-gray-900">{formatPriceDisplay(totalPrice)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 flex items-center gap-1.5">
          <Truck size={14} className="text-brand-green" />
          Livraison
        </span>
        <span className="font-semibold text-brand-green">Gratuite</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Taxes</span>
        <span className="font-medium text-gray-700">Incluses</span>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <div className="flex justify-between items-baseline">
          <span className="text-base font-bold text-gray-900">Total</span>
          <span className="text-xl font-bold text-brand-green">{formatPriceDisplay(totalPrice)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={creatingOrder}
        className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white py-3.5 rounded-xl font-bold text-sm md:text-base transition-all hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {creatingOrder ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            <span>Création en cours…</span>
          </>
        ) : (
          <>
            <ShoppingCart size={18} />
            <span>Passer la commande</span>
          </>
        )}
      </button>

      {showClearButton && (
        <button
          type="button"
          onClick={onClearCart}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 size={15} />
          Vider le panier
        </button>
      )}

      <div className="flex items-center justify-center gap-4 pt-1 text-[10px] text-gray-400">
        <span className="inline-flex items-center gap-1">
          <Shield size={12} className="text-brand-green" />
          Sécurisé
        </span>
        <span className="inline-flex items-center gap-1">
          <Truck size={12} className="text-brand-green" />
          Livraison offerte
        </span>
      </div>
    </div>
    <div className="h-0.5 bg-gradient-to-r from-brand-green via-brand-orange to-brand-green" aria-hidden />
  </div>
);

const CartEmptyState = () => (
  <div className="min-h-screen bg-brand-cream pb-24">
    <div className="max-w-3xl mx-auto px-4 pt-4">
      <CartPageHeader itemCount={0} totalItems={0} totalPrice={0} />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-center px-6 py-12 md:py-16">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-brand-green-light flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={40} className="text-brand-green" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Votre panier est vide</h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-8">
          Parcourez notre catalogue et découvrez les trésors du Maroc livrés chez vous.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/catalog"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-orange hover:bg-brand-orange-dark text-white rounded-xl font-bold text-sm transition-all hover:shadow-md"
          >
            <Package size={18} />
            Découvrir le catalogue
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:border-brand-green hover:text-brand-green transition-colors"
          >
            <Home size={18} />
            Retour à l&apos;accueil
          </Link>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-brand-green via-brand-orange to-brand-green mt-10" aria-hidden />
      </div>
    </div>
  </div>
);

const ModernCart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const cartContext = useCart();
  
  // Vérification de sécurité pour le contexte
  if (!cartContext) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du panier...</p>
        </div>
      </div>
    );
  }
  
  const { items: contextItems, removeItem, updateQuantity, updateItem, clearCart, replaceItems, getTotalItems, getTotalPrice } = cartContext;
  
  // Utiliser directement le contexte (pas d'état local)
  const cartItems = contextItems || [];
  const cartSummary = {
    total_items: getTotalItems ? getTotalItems() : 0,
    total_price: getTotalPrice ? getTotalPrice() : 0,
    items_count: cartItems.length
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(null);

  const [cartSessionId, setCartSessionId] = useState(localStorage.getItem('cart_session_id'));
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [checkoutAlert, setCheckoutAlert] = useState(null);
  const [orderData, setOrderData] = useState(null);
  
  // Cache pour éviter les requêtes redondantes
  const abortControllerRef = useRef(null);
  
  // Cache persistant de session
  const SESSION_CACHE_KEY = 'bs_shop_cart_cache';

  // Gérer le message de bienvenue depuis la navigation
  useEffect(() => {
    if (location.state?.message) {
      setWelcomeMessage(location.state.message);
      // Nettoyer l'état de navigation pour éviter la réaffichage
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const loadCart = useCallback(async () => {
    // Vider le cache de session pour forcer le rechargement depuis l'API
    // Cela garantit que les données réelles de l'API remplacent les données locales
    try {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
    } catch (error) {
      console.warn('Erreur lors de la suppression du cache de session:', error);
    }

    // Ne pas appeler clearCart ici pour éviter les boucles infinies
    // Les données de l'API remplaceront naturellement les données locales

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      
      // Préparer les headers avec la session du panier
      const headers = {};
      if (cartSessionId) {
        headers['X-Session-ID'] = cartSessionId;
      }
      
      const response = await cartService.getCart(headers);
      
      if (response.success) {
        const items = response.data.items || [];
        
        // Debug: Afficher la structure des données du panier
        console.log('📦 Données du panier chargées:', { items, summary: response.data.summary });
        console.log('📦 Structure des items:', items.map(item => ({ 
          id: item.id, 
          product_id: item.product_id, 
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        })));
        
        // Formater tous les items de l'API
        const apiItems = items.map(item => {
          const unitPrice = item.unit_price || (item.variant?.price || item.product?.base_price || 0);
          return {
            id: item.id, // ID réel de la base de données
            product_id: item.product?.id || item.product_id,
            variant_id: item.variant?.id || item.variant_id,
            name: item.product?.name || 'Nom du produit',
            price: unitPrice, // Pour le contexte (calcul des totaux)
            unit_price: unitPrice, // Pour l'affichage
            image: item.product?.image_main || null,
            quantity: item.quantity || 1,
            product: item.product,
            variant: item.variant
          };
        });
        
        // Récupérer les articles locaux actuels (avec des IDs composés)
        const localItems = contextItems || [];
        
        // Identifier les articles locaux qui ne sont pas encore synchronisés avec l'API
        const unsyncedLocalItems = localItems.filter(localItem => {
          // Un article local est non synchronisé s'il a un ID composé (contient '_')
          const isComposedId = typeof localItem.id === 'string' && localItem.id.includes('_');
          return isComposedId;
        });
        
        // Fusionner les articles de l'API avec les articles locaux non synchronisés
        const mergedItems = [...apiItems, ...unsyncedLocalItems];
        
        console.log('📦 Articles de l\'API:', apiItems);
        console.log('📦 Articles locaux non synchronisés:', unsyncedLocalItems);
        console.log('📦 Articles fusionnés:', mergedItems);
        
        // Remplacer les items du contexte avec la liste fusionnée
        replaceItems(mergedItems);
        
        // Mettre en cache de session
        try {
          const sessionData = {
            data: { items, summary: response.data.summary },
            timestamp: Date.now()
          };
          sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(sessionData));
        } catch (error) {
          console.warn('Erreur lors de la sauvegarde du cache de session du panier:', error);
        }
        
        // Mettre à jour la session ID si elle est fournie
        if (response.data?.session_id && response.data.session_id !== cartSessionId) {
          setCartSessionId(response.data.session_id);
          localStorage.setItem('cart_session_id', response.data.session_id);
        }
      } else {
        setError('Erreur lors du chargement du panier');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erreur lors du chargement du panier:', err);
        setError('Erreur lors du chargement du panier');
      }
    } finally {
      setLoading(false);
    }
  }, [cartSessionId, replaceItems]);

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }
    
    // Debug: Afficher l'ID utilisé
    console.log('🔄 Mise à jour quantité - ID utilisé:', itemId, 'Quantité:', newQuantity);
    
    // Mise à jour instantanée dans le contexte (UI réactive) - comme dans ModernProductDetail
    updateQuantity(itemId, newQuantity);
    
    // Synchronisation avec l'API en arrière-plan (sans bloquer l'UI)
    const headers = {};
    if (cartSessionId) {
      headers['X-Session-ID'] = cartSessionId;
    }
    
    // Vérifier si c'est un ID composé (local) ou un ID de base de données
    const isComposedId = typeof itemId === 'string' && itemId.includes('_');
    
    if (isComposedId) {
      // Pour les IDs composés, on ne fait pas de requête API car l'article n'existe pas encore en base
      console.log('🔄 ID composé détecté, pas de requête API nécessaire');
      return;
    }
    
    // Faire la requête API en arrière-plan sans bloquer l'UI
    cartService.updateCartItem(itemId, newQuantity, headers)
      .then(response => {
        if (!response || !response.success) {
          console.warn('Erreur API lors de la mise à jour de la quantité:', response);
        }
      })
      .catch(err => {
        console.error('Erreur API lors de la mise à jour de la quantité:', err);
      });
  };

  const handleRemoveItem = (itemId) => {
    // Debug: Afficher l'ID utilisé
    console.log('🗑️ Suppression article - ID utilisé:', itemId);
    
    // Suppression instantanée dans le contexte (UI réactive) - comme dans ModernProductDetail
    removeItem(itemId);
    
    // Synchronisation avec l'API en arrière-plan (sans bloquer l'UI)
    const headers = {};
    if (cartSessionId) {
      headers['X-Session-ID'] = cartSessionId;
    }
    
    // Vérifier si c'est un ID composé (local) ou un ID de base de données
    const isComposedId = typeof itemId === 'string' && itemId.includes('_');
    
    if (isComposedId) {
      // Pour les IDs composés, on ne fait pas de requête API car l'article n'existe pas encore en base
      console.log('🗑️ ID composé détecté, pas de requête API nécessaire');
      return;
    }
    
    // Faire la requête API en arrière-plan sans bloquer l'UI
    cartService.removeCartItem(itemId, headers)
      .then(response => {
        if (!response || !response.success) {
          console.warn('Erreur API lors de la suppression de l\'article:', response);
        }
      })
      .catch(err => {
        console.error('Erreur API lors de la suppression de l\'article:', err);
      });
  };

  const handleClearCart = () => {
    // Vider le panier dans le contexte (UI réactive) - comme dans ModernProductDetail
    clearCart();
    
    // Synchronisation avec l'API en arrière-plan (sans bloquer l'UI)
    const headers = {};
    if (cartSessionId) {
      headers['X-Session-ID'] = cartSessionId;
    }
    
    // Faire la requête API en arrière-plan sans bloquer l'UI
    cartService.clearCart(headers)
      .then(response => {
        if (!response || !response.success) {
          console.warn('Erreur API lors de la suppression du panier:', response);
        }
      })
      .catch(err => {
        console.error('Erreur API lors de la suppression du panier:', err);
      });
  };

  const isLocalOnlyCartItem = (item) =>
    typeof item.id === 'string' && String(item.id).includes('_');

  const buildCartPayload = (item) =>
    item.variant_id
      ? { product_id: item.product_id, variant_id: item.variant_id, quantity: item.quantity }
      : { product_id: item.product_id, quantity: item.quantity };

  const applyAddToCartResponse = (item, response, sessionRef) => {
    if (!response?.success) {
      throw new Error(response?.message || 'Impossible de synchroniser le panier');
    }

    if (response.data?.session_id) {
      sessionRef.current = response.data.session_id;
      setCartSessionId(response.data.session_id);
      localStorage.setItem('cart_session_id', response.data.session_id);
    }

    if (response.data?.cart_item && isLocalOnlyCartItem(item)) {
      const apiItem = response.data.cart_item;
      updateItem(item.id, {
        id: apiItem.id,
        product_id: apiItem.product?.id ?? item.product_id,
        variant_id: apiItem.variant?.id ?? item.variant_id,
        name: apiItem.product?.name ?? item.name,
        price: apiItem.unit_price ?? item.price,
        unit_price: apiItem.unit_price ?? item.price,
        image: apiItem.product?.image_main ?? item.image,
        quantity: apiItem.quantity ?? item.quantity,
        product: apiItem.product ?? item.product,
        variant: apiItem.variant ?? item.variant,
      });
    }
  };

  const syncCartToApi = useCallback(async () => {
    const sessionRef = { current: cartSessionId || localStorage.getItem('cart_session_id') };
    const headers = {};
    if (sessionRef.current) {
      headers['X-Session-ID'] = sessionRef.current;
    }

    const items = contextItems || [];
    const localOnlyItems = items.filter(isLocalOnlyCartItem);

    for (const item of localOnlyItems) {
      const response = await cartService.addToCart(buildCartPayload(item), headers);
      applyAddToCartResponse(item, response, sessionRef);
      if (sessionRef.current) {
        headers['X-Session-ID'] = sessionRef.current;
      }
    }

    if (!sessionRef.current && items.length > 0) {
      for (const item of items) {
        if (isLocalOnlyCartItem(item)) continue;
        const response = await cartService.addToCart(buildCartPayload(item), headers);
        applyAddToCartResponse(item, response, sessionRef);
        if (sessionRef.current) {
          headers['X-Session-ID'] = sessionRef.current;
          break;
        }
      }
    }

    if (sessionRef.current) {
      const cartRes = await cartService.getCart({ 'X-Session-ID': sessionRef.current });
      const apiItems = cartRes?.data?.items ?? [];
      if (apiItems.length === 0 && items.length > 0) {
        for (const item of items) {
          const response = await cartService.addToCart(buildCartPayload(item), headers);
          applyAddToCartResponse(item, response, sessionRef);
        }
      }
    }

    return sessionRef.current;
  }, [cartSessionId, contextItems, updateItem]);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setCheckoutAlert({ type: 'error', message: 'Votre panier est vide.' });
      return;
    }

    try {
      setCreatingOrder(true);
      setCheckoutAlert(null);

      const sessionId = await syncCartToApi();

      if (!sessionId) {
        setCheckoutAlert({
          type: 'error',
          message: 'Impossible de préparer votre panier. Vérifiez votre connexion et réessayez.',
        });
        return;
      }

      if (!isAuthenticated || !user) {
        sessionStorage.setItem(
          'checkout_data',
          JSON.stringify({
            session_id: sessionId,
            cart_summary: cartSummary,
            cart_items: cartItems,
          })
        );
        navigate('/auth/quick-register');
        return;
      }

      const orderResult = await orderService.createOrder({
        session_id: sessionId,
        notes: `Commande créée par ${user.name} - ${cartSummary.total_items} article(s)`,
      });

      if (orderResult.success) {
        clearCart();
        localStorage.removeItem('cart_session_id');
        navigate('/order-success', {
          state: {
            order: orderResult.data.order,
            isNewUser: false,
            user,
          },
        });
        return;
      }

      if (orderResult.status === 401) {
        setCheckoutAlert({
          type: 'error',
          message: 'Votre session a expiré. Reconnectez-vous pour finaliser la commande.',
        });
        return;
      }

      setCheckoutAlert({
        type: 'error',
        message: orderResult.message || 'Erreur lors de la création de la commande',
      });
    } catch (err) {
      console.error('Erreur lors du checkout:', err);
      setCheckoutAlert({
        type: 'error',
        message: err.message || 'Une erreur est survenue. Réessayez.',
      });
    } finally {
      setCreatingOrder(false);
    }
  };

  // Charger le panier depuis l'API au montage du composant
  useEffect(() => {
    // Ne charger depuis l'API que si le contexte est vide ou ne contient que des articles locaux
    const hasOnlyLocalItems = contextItems && contextItems.length > 0 && 
      contextItems.every(item => typeof item.id === 'string' && item.id.includes('_'));
    
    if (!contextItems || contextItems.length === 0 || hasOnlyLocalItems) {
      console.log('📦 Chargement depuis l\'API car:', {
        noItems: !contextItems || contextItems.length === 0,
        onlyLocalItems: hasOnlyLocalItems
      });
      loadCart();
    } else {
      console.log('📦 Pas de chargement API nécessaire, articles déjà présents');
      setLoading(false);
    }
  }, []); // Pas de dépendances pour éviter les boucles infinies

  const closeWhatsAppModal = () => {
    setShowWhatsAppModal(false);
  };

  // Affichage du chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center pb-24">
        <div className="text-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-green-light flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-brand-green border-t-transparent" />
          </div>
          <p className="text-sm font-medium text-gray-700">Chargement de votre panier…</p>
          <p className="text-xs text-gray-400 mt-1">Un instant</p>
        </div>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center pb-24 px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 text-2xl">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            {error.includes('création de la commande') ? 'Erreur de commande' : 'Erreur de chargement'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => setError(null)}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Retour au panier
            </button>
            {!error.includes('création de la commande') && (
              <button
                type="button"
                onClick={loadCart}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-brand-orange text-white hover:bg-brand-orange-dark transition-colors"
              >
                Réessayer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return <CartEmptyState />;
  }

  return (
    <div className="min-h-screen bg-brand-cream pb-32 md:pb-12">
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <CartPageHeader
          itemCount={cartItems.length}
          totalItems={cartSummary.total_items}
          totalPrice={cartSummary.total_price}
        />

        {checkoutAlert && (
          <div
            className={`mb-4 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-sm border ${
              checkoutAlert.type === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-white border-brand-green/20'
            }`}
            role="alert"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
                ⚠️
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">Commande impossible</p>
                <p className="text-xs text-gray-600 mt-0.5">{checkoutAlert.message}</p>
                {checkoutAlert.type === 'error' && checkoutAlert.message.includes('session') && (
                  <Link
                    to="/auth/login"
                    className="inline-block mt-2 text-xs font-semibold text-brand-green hover:underline"
                  >
                    Se reconnecter
                  </Link>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCheckoutAlert(null)}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {welcomeMessage && (
          <div className="mb-4 bg-white border border-brand-green/20 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-green-light flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-brand-green" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{welcomeMessage}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Vous pouvez maintenant finaliser votre commande.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWelcomeMessage(null)}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 md:px-5 md:py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm md:text-base font-bold text-gray-900">
                  Vos articles
                </h2>
                <span className="text-[11px] font-semibold text-brand-green bg-brand-green-light px-2.5 py-1 rounded-full">
                  {cartItems.length} ligne{cartItems.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {cartItems.map(
                  (item) =>
                    item?.id && (
                      <CartLineItem
                        key={item.id}
                        item={item}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemoveItem}
                      />
                    )
                )}
              </div>
              <div className="h-0.5 bg-gradient-to-r from-brand-green via-brand-orange to-brand-green" aria-hidden />
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-1">
            <OrderSummaryCard
              totalItems={cartSummary.total_items}
              totalPrice={cartSummary.total_price}
              creatingOrder={creatingOrder}
              onCheckout={handleCheckout}
              onClearCart={handleClearCart}
              showClearButton={cartItems.length > 0}
              className="sticky top-24"
            />
          </div>
        </div>

        <div className="mt-8">
          <CartSuggestions cartSessionId={cartSessionId} />
        </div>

        <div className="mt-6 mb-4">
          <div className="bg-white rounded-2xl border border-brand-green/15 overflow-hidden shadow-sm">
            <div className="px-4 py-4 md:px-5 bg-gradient-to-r from-brand-green-light/40 to-white">
              <h3 className="text-sm font-bold text-brand-green-dark flex items-center gap-2">
                <MessageCircle size={16} />
                Prochaine étape
              </h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                {isAuthenticated
                  ? 'Validez votre commande — nous vous contactons via WhatsApp pour organiser la livraison.'
                  : 'Créez votre compte en quelques secondes pour finaliser. Nous vous recontactons ensuite par WhatsApp. Simple et sécurisé.'}
              </p>
            </div>
            <div className="h-0.5 bg-gradient-to-r from-brand-green via-brand-orange to-brand-green" aria-hidden />
          </div>
        </div>
      </div>

      {/* Barre fixe mobile — commande */}
      <div className="lg:hidden fixed bottom-[4.5rem] left-0 right-0 z-[60] px-4 pb-2 pt-2 bg-gradient-to-t from-brand-cream via-brand-cream to-transparent pointer-events-none">
        <div className="pointer-events-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Total</p>
            <p className="text-lg font-bold text-brand-green truncate">
              {formatPriceDisplay(cartSummary.total_price)}
            </p>
            <p className="text-[10px] text-gray-400">
              {cartSummary.total_items} article{cartSummary.total_items > 1 ? 's' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={creatingOrder}
            className="flex-shrink-0 bg-brand-orange hover:bg-brand-orange-dark text-white px-5 py-3 rounded-xl font-bold text-sm transition-all disabled:bg-gray-300 flex items-center gap-2 shadow-md"
          >
            {creatingOrder ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <ShoppingCart size={16} />
            )}
            Commander
          </button>
        </div>
        </div>
      </div>

      {/* Modal WhatsApp */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-brand-green rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={28} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Commande validée !</h3>
              <p className="text-sm text-gray-500">
                Votre commande a été créée. Nous vous contactons via WhatsApp pour finaliser.
              </p>
            </div>

            <div className="bg-brand-cream rounded-xl p-4 mb-6 text-sm">
              <h4 className="font-semibold text-gray-900 mb-2">Récapitulatif</h4>
              {orderData ? (
                <>
                  <div className="flex justify-between mb-1 text-gray-600">
                    <span>N° commande</span>
                    <span className="font-medium text-gray-900">{orderData.order_number}</span>
                  </div>
                  <div className="flex justify-between mb-1 text-gray-600">
                    <span>Articles</span>
                    <span>{orderData.summary?.total_items || cartSummary.total_items}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatPriceDisplay(orderData.total_amount || cartSummary.total_price)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between mb-1 text-gray-600">
                    <span>Articles</span>
                    <span>{cartSummary.total_items}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatPriceDisplay(cartSummary.total_price)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeWhatsAppModal}
                className="flex-1 py-3 rounded-xl font-medium text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  let message = 'Bonjour ! J\'ai une commande ';
                  if (orderData) {
                    message += `(${orderData.order_number}) de ${orderData.summary?.total_items || cartSummary.total_items} article(s) pour un total de ${formatPriceDisplay(orderData.total_amount || cartSummary.total_price)}.`;
                  } else {
                    message += `de ${cartSummary.total_items} article(s) pour un total de ${formatPriceDisplay(cartSummary.total_price)}.`;
                  }
                  message += ' Pouvez-vous m\'aider ?';
                  window.open(generateWhatsAppLink(message), '_blank');
                  closeWhatsAppModal();
                }}
                className="flex-1 py-3 rounded-xl font-medium text-sm bg-brand-green text-white hover:bg-brand-green-dark transition-colors"
              >
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernCart;
