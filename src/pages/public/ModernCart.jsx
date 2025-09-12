import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, MessageCircle, CheckCircle, X } from 'lucide-react';
import { cartService, orderService, authService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import CartSuggestions from '../../components/CartSuggestions';
import { generateWhatsAppLink, CONTACT_CONFIG } from '../../config/contact';

const ModernCart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const cartContext = useCart();
  
  // Vérification de sécurité pour le contexte
  if (!cartContext) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du panier...</p>
        </div>
      </div>
    );
  }
  
  const { items: contextItems, isUpdating, addItem, removeItem, updateQuantity, clearCart, replaceItems, getTotalItems, getTotalPrice } = cartContext;
  
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
  const [orderData, setOrderData] = useState(null);
  
  // Cache pour éviter les requêtes redondantes
  const cartCacheRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  // Cache persistant de session
  const SESSION_CACHE_KEY = 'bs_shop_cart_cache';
  const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Gérer le message de bienvenue depuis la navigation
  useEffect(() => {
    if (location.state?.message) {
      setWelcomeMessage(location.state.message);
      // Nettoyer l'état de navigation pour éviter la réaffichage
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Fonction utilitaire pour formater les prix de manière sécurisée
  const formatPrice = useCallback((price) => {
    if (price === null || price === undefined || price === '') return '0 FCFA';
    const numPrice = Number(price);
    if (isNaN(numPrice)) return '0 FCFA';
    return `${Math.round(numPrice)} FCFA`;
  }, []);

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

  const handleCheckout = async () => {
    // Vérifier si l'utilisateur est déjà connecté
    if (isAuthenticated && user) {
      console.log('👤 Utilisateur déjà connecté, création directe de la commande');
      
      try {
        setCreatingOrder(true);
        
        const orderData = {
          session_id: cartSessionId,
          notes: `Commande créée par ${user.name} - ${cartSummary.total_items} article(s)`
        };
        
        console.log('📦 Données de commande:', orderData);
        const orderResult = await orderService.createOrder(orderData);
        console.log('📦 Résultat création commande:', orderResult);
        
        if (orderResult.success) {
          console.log('✅ Commande créée avec succès, redirection vers la page de succès');
          
          // Vider le panier après commande réussie
          clearCart();
          
          // Rediriger vers la page de confirmation de commande avec les données
          navigate('/order-success', {
            state: {
              order: orderResult.data.order,
              isNewUser: false,
              user: user
            }
          });
        } else {
          console.error('❌ Erreur lors de la création de la commande:', orderResult.message);
          setError(orderResult.message || 'Erreur lors de la création de la commande');
        }
      } catch (orderError) {
        console.error('❌ Erreur lors de la création de la commande:', orderError);
        setError('Erreur lors de la création de la commande: ' + (orderError.message || 'Erreur inconnue'));
      } finally {
        setCreatingOrder(false);
      }
    } else {
      console.log('👤 Utilisateur non connecté, redirection vers inscription rapide');
      
      // Rediriger vers la page d'inscription rapide avec les données du panier
      const checkoutData = {
        session_id: cartSessionId,
        cart_summary: cartSummary,
        cart_items: cartItems
      };
      
      // Stocker temporairement les données du panier
      sessionStorage.setItem('checkout_data', JSON.stringify(checkoutData));
      
      // Rediriger vers l'inscription rapide
      navigate('/auth/quick-register');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du panier...</p>
        </div>
      </div>
    );
  }



  // Affichage de l'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error.includes('création de la commande') ? 'Erreur de validation' : 'Erreur de chargement'}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-3 justify-center">
            <button 
              onClick={() => setError(null)} 
              className="bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
            >
              Retour au panier
            </button>
            {!error.includes('création de la commande') && (
              <button 
                onClick={loadCart} 
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
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
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-600 hover:text-gray-800 transition-colors">
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panier d'achat</h1>
                <p className="text-sm text-gray-500">Votre panier est vide</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu panier vide */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingBag size={64} className="text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Votre panier est vide</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Découvrez nos produits et ajoutez-les à votre panier pour commencer vos achats.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/catalog"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 hover:shadow-lg"
              >
                <ShoppingBag size={20} className="mr-2" />
                Découvrir nos produits
              </Link>
              <Link
                to="/"
                className="inline-flex items-center px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
              >
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header moderne style e-commerce */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link to="/" className="text-gray-600 hover:text-gray-800 transition-colors">
                <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
              </Link>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Panier d'achat</h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  {cartItems.length} article{cartItems.length > 1 ? 's' : ''} dans votre panier
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-xl font-bold text-blue-600">
                    {formatPrice(cartSummary.total_price)}
                  </div>
              </div>
              <div className="bg-blue-100 text-blue-800 px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium">
                {cartSummary.total_items} article{cartSummary.total_items > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message de bienvenue pour les nouveaux utilisateurs */}
      {welcomeMessage && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">{welcomeMessage}</p>
                <p className="text-xs text-green-600 mt-1">
                  Vous êtes maintenant connecté et pouvez finaliser votre commande.
                </p>
              </div>
            </div>
            <button
              onClick={() => setWelcomeMessage(null)}
              className="flex-shrink-0 text-green-400 hover:text-green-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          
          {/* Liste des articles - Style Amazon/Jumia */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Articles dans votre panier ({cartItems.length})
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {cartItems && Array.isArray(cartItems) && cartItems.map((item) => 
                  item && item.id ? (
                    <div key={item.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 transform-gpu mb-4 sm:mb-6 overflow-hidden">
                      <div className="p-3 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-6">
                          {/* Image du produit - Optimisé mobile */}
                          <div className="flex items-center space-x-3 sm:block">
                            <Link 
                              to={`/products/${item.product_id}`}
                              className="w-20 h-20 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50 hover:opacity-90 transition-all duration-300 hover:scale-105 group"
                            >
                              <div className="w-full h-full flex items-center justify-center">
                          <img
                            src={item.product?.image_main || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop'}
                            alt={item.product?.name || 'Produit'}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 rounded-lg"
                          />
                        </div>
                            </Link>
                            
                            {/* Informations principales - Mobile */}
                            <div className="flex-1 sm:hidden">
                              <Link 
                                to={`/products/${item.product_id}`}
                                className="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer line-clamp-2 mb-1"
                              >
                                {item.product?.name || 'Nom du produit'}
                              </Link>
                              
                              {/* Variante mobile */}
                              {item.variant?.name && (
                                <div className="mb-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                    {item.variant.name}
                                  </span>
                                </div>
                              )}
                              
                              {/* Prix mobile */}
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-bold text-blue-600">
                                  {formatPrice(item.unit_price)}
                                </span>
                                <span className="text-xs text-gray-500">unité</span>
                              </div>
                            </div>
                          </div>

                          {/* Informations du produit - Desktop */}
                          <div className="flex-1 min-w-0 hidden sm:block">
                            <Link 
                              to={`/products/${item.product_id}`}
                              className="text-lg sm:text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer line-clamp-2 mb-2"
                            >
                            {item.product?.name || 'Nom du produit'}
                            </Link>
                            
                            {/* Variante avec badge moderne */}
                            {item.variant?.name && (
                              <div className="mb-3">
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200">
                                  {item.variant.name}
                                </span>
                              </div>
                            )}
                            
                            {/* Prix principal - Style modernisé */}
                            <div className="mb-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-blue-600">
                                  {formatPrice(item.unit_price)}
                                </span>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">unité</span>
                              </div>
                            </div>
                          
                          {/* Contrôles de quantité modernes */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium text-gray-700">Quantité:</span>
                                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                                  <button
                                    onClick={() => {
                                      console.log('🔍 Item ID dans JSX:', item.id, 'Item complet:', item);
                                      handleUpdateQuantity(item.id, item.quantity - 1);
                                    }}
                                    disabled={item.quantity <= 1}
                                    className="w-12 sm:w-16 h-12 sm:h-14 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-bold"
                                  >
                                    <Minus size={20} />
                                  </button>
                                  <span className="w-12 sm:w-16 text-center font-bold text-gray-900 border-x-2 border-gray-200 py-3 text-lg bg-gray-50">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => {
                                      console.log('🔍 Item ID dans JSX (plus):', item.id, 'Item complet:', item);
                                      handleUpdateQuantity(item.id, item.quantity + 1);
                                    }}
                                    className="w-12 sm:w-16 h-12 sm:h-14 flex items-center justify-center hover:bg-gray-50 transition-colors text-lg font-bold"
                                  >
                                    <Plus size={20} />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-sm text-gray-500 mb-1">Sous-total</div>
                                <div className="text-2xl font-bold text-blue-600">
                                  {formatPrice(item.unit_price * item.quantity)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Contrôles mobile - Optimisés */}
                          <div className="sm:hidden w-full">
                            {/* Contrôles de quantité mobile */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-700">Quantité:</span>
                                <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                                <button
                                  onClick={() => {
                                    console.log('🔍 Item ID dans JSX:', item.id, 'Item complet:', item);
                                    handleUpdateQuantity(item.id, item.quantity - 1);
                                  }}
                                  disabled={item.quantity <= 1}
                                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Minus size={16} />
                                </button>
                                  <span className="w-12 text-center font-bold text-gray-900 border-x-2 border-gray-200 py-2 text-sm bg-gray-50">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => {
                                    console.log('🔍 Item ID dans JSX (plus):', item.id, 'Item complet:', item);
                                    handleUpdateQuantity(item.id, item.quantity + 1);
                                  }}
                                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="text-right">
                                <div className="text-xs text-gray-500">Sous-total</div>
                                <div className="text-lg font-bold text-blue-600">
                                  {formatPrice(item.unit_price * item.quantity)}
                                </div>
                              </div>
                            </div>
                            
                            {/* Actions mobile */}
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => {
                                  console.log('🔍 Item ID dans JSX (suppression):', item.id, 'Item complet:', item);
                                  handleRemoveItem(item.id);
                                }}
                                className="flex items-center space-x-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer cet article"
                              >
                                <Trash2 size={16} />
                                <span className="text-sm font-medium">Supprimer</span>
                              </button>
                              
                              <Link 
                                to={`/products/${item.product_id}`}
                                className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <span className="text-sm font-medium">Voir détails</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                          </div>
                        </div>

                          {/* Bouton supprimer - Desktop */}
                        <button
                          onClick={() => {
                            console.log('🔍 Item ID dans JSX (suppression):', item.id, 'Item complet:', item);
                            handleRemoveItem(item.id);
                          }}
                            className="hidden sm:block p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0 hover:scale-110 transform"
                          title="Supprimer cet article"
                        >
                            <Trash2 size={24} />
                        </button>
                        </div>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          </div>

          {/* Sidebar de résumé - Style Amazon/Jumia */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-24">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Résumé de la commande</h3>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4">
                {/* Sous-total */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total ({cartSummary.total_items} article{cartSummary.total_items > 1 ? 's' : ''})</span>
                  <span className="font-medium">{formatPrice(cartSummary.total_price)}</span>
                </div>
                
                {/* Frais de livraison */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frais de livraison</span>
                  <span className="font-medium text-green-600">Gratuit</span>
                </div>
                
                {/* Taxe */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxes</span>
                  <span className="font-medium">Incluses</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">{formatPrice(cartSummary.total_price)}</span>
                  </div>
                </div>
                
                {/* Bouton de commande */}
                <button
                  onClick={handleCheckout}
                  disabled={creatingOrder || cartItems.length === 0}
                  className="w-full bg-blue-600 text-white py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  {creatingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Création...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={20} />
                      <span>Passer la commande</span>
                    </>
                  )}
                </button>
                
                {/* Bouton vider le panier */}
                {cartItems.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Trash2 size={16} />
                    <span>Vider le panier</span>
                  </button>
                )}
                
                {/* Informations de sécurité */}
                <div className="text-xs text-gray-500 text-center space-y-1">
                  <p>🔒 Paiement sécurisé</p>
                  <p>🚚 Livraison gratuite</p>
                  <p>↩️ Retour facile</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section suggestions intelligentes */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <CartSuggestions cartSessionId={cartSessionId} />
      </div>

      {/* Informations supplémentaires */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-blue-50 rounded-xl p-6">
          <h4 className="font-semibold text-blue-900 mb-2">Étapes suivantes</h4>
          <p className="text-sm text-blue-800">
          {isAuthenticated 
            ? 'Validez votre commande et nous vous contacterons via WhatsApp pour organiser la livraison.'
            : 'Créez votre compte rapidement pour finaliser votre commande. Nous vous contacterons ensuite via WhatsApp pour organiser la livraison. Simple et sécurisé !'
          }
        </p>
        </div>
      </div>

      {/* Modal WhatsApp */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Commande validée !</h3>
              <p className="text-gray-600">
                Votre commande a été créée avec succès. Nous allons vous contacter via WhatsApp pour finaliser.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Récapitulatif :</h4>
              <div className="text-sm text-gray-600">
                {orderData && (
                  <>
                    <div className="flex justify-between mb-1">
                      <span>Numéro de commande :</span>
                      <span className="font-medium">{orderData.order_number}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Articles :</span>
                      <span>{orderData.summary?.total_items || cartSummary.total_items}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total :</span>
                      <span>{formatPrice(orderData.total_amount || cartSummary.total_price)} FCFA</span>
                    </div>
                  </>
                )}
                {!orderData && (
                  <>
                    <div className="flex justify-between mb-1">
                      <span>Articles :</span>
                      <span>{cartSummary.total_items}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total :</span>
                      <span>{formatPrice(cartSummary.total_price)} FCFA</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={closeWhatsAppModal}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  // Créer le message WhatsApp avec les informations de la commande
                  let message = `Bonjour ! J'ai une commande `;
                  if (orderData) {
                    message += `(${orderData.order_number}) de ${orderData.summary?.total_items || cartSummary.total_items} article(s) pour un total de ${formatPrice(orderData.total_amount || cartSummary.total_price)} FCFA.`;
                  } else {
                    message += `de ${cartSummary.total_items} article(s) pour un total de ${formatPrice(cartSummary.total_price)} FCFA.`;
                  }
                  message += ` Pouvez-vous m'aider ?`;
                  
                  const whatsappUrl = generateWhatsAppLink(message);
                  window.open(whatsappUrl, '_blank');
                  closeWhatsAppModal();
                }}
                className="flex-1 bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition-colors"
              >
                Ouvrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernCart;
