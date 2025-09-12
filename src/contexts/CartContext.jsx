import { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react'
import { cartService } from '../services/api'

const CartContext = createContext()

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM':
      // Chercher un article existant avec le même product_id et variant_id
      const existingItem = state.items.find(item => 
        item.product_id === action.payload.product_id && 
        item.variant_id === action.payload.variant_id
      )
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.product_id === action.payload.product_id && 
            item.variant_id === action.payload.variant_id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        }
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload }]
      }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      }

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      }

    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      }

    case 'REPLACE_ITEMS':
      return {
        ...state,
        items: action.payload
      }

    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.oldId
            ? { ...action.payload.newItem }
            : item
        )
      }

    default:
      return state
  }
}

export function CartProvider({ children }) {
  // Initialiser le state depuis localStorage
  const getInitialState = () => {
    try {
      const saved = localStorage.getItem('cart_state');
      return saved ? JSON.parse(saved) : { items: [] };
    } catch {
      return { items: [] };
    }
  };

  const [state, dispatch] = useReducer(cartReducer, getInitialState());
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [cartSessionId, setCartSessionId] = useState(() => {
    return localStorage.getItem('cart_session_id') || null;
  });

  // Charger le panier depuis l'API au démarrage
  useEffect(() => {
    const loadCartFromAPI = async () => {
      if (!cartSessionId) return;
      
      try {
        const response = await cartService.getCart(cartSessionId);
        if (response.success && response.data?.items) {
          const apiItems = response.data.items.map(item => ({
            id: item.id,
            product_id: item.product?.id || item.product_id,
            variant_id: item.variant?.id || item.variant_id,
            name: item.product?.name || 'Nom du produit',
            price: item.unit_price || (item.variant?.price || item.product?.base_price || 0),
            unit_price: item.unit_price || (item.variant?.price || item.product?.base_price || 0),
            image: item.product?.image_main || null,
            quantity: item.quantity,
            product: item.product,
            variant: item.variant
          }));
          
          // Remplacer les items locaux par ceux de l'API
          dispatch({ type: 'REPLACE_ITEMS', payload: apiItems });
        }
      } catch (error) {
        console.error('Erreur lors du chargement du panier depuis l\'API:', error);
      }
    };

    loadCartFromAPI();
  }, [cartSessionId]);

  // Calculer les totaux
  const getTotalItems = useCallback(() => {
    return state.items.reduce((total, item) => total + item.quantity, 0)
  }, [state.items])

  const getTotalPrice = useCallback(() => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }, [state.items])

  // Sauvegarder le panier dans localStorage et notifier les changements
  useEffect(() => {
    localStorage.setItem('cart_state', JSON.stringify(state));
    
    // Notifier tous les composants du changement
    const totalItems = getTotalItems();
    const totalPrice = getTotalPrice();
    
    window.dispatchEvent(new CustomEvent('cartUpdated', { 
      detail: { 
        items: state.items, 
        totalItems: totalItems, 
        totalPrice: totalPrice,
        timestamp: Date.now()
      } 
    }));
    
    setLastUpdate(Date.now());
  }, [state, getTotalItems, getTotalPrice]);

  const addItem = useCallback(async (item) => {
    // Ajouter localement IMMÉDIATEMENT pour la fluidité
    dispatch({ type: 'ADD_ITEM', payload: item });
    
    // Synchroniser avec l'API en arrière-plan (sans bloquer l'UI)
    setTimeout(async () => {
      try {
        const response = await cartService.addToCart(item, cartSessionId);
        
        if (response.success) {
          // Mettre à jour l'ID de session si nécessaire
          if (response.data?.session_id && response.data.session_id !== cartSessionId) {
            setCartSessionId(response.data.session_id);
            localStorage.setItem('cart_session_id', response.data.session_id);
          }
          
          // Mettre à jour l'item avec les données de l'API (silencieusement)
          if (response.data?.cart_item) {
            const apiItem = response.data.cart_item;
            const formattedApiItem = {
              id: apiItem.id,
              product_id: apiItem.product?.id || apiItem.product_id,
              variant_id: apiItem.variant?.id || apiItem.variant_id,
              name: apiItem.product?.name || 'Nom du produit',
              price: apiItem.unit_price || (apiItem.variant?.price || apiItem.product?.base_price || 0),
              unit_price: apiItem.unit_price || (apiItem.variant?.price || apiItem.product?.base_price || 0),
              image: apiItem.product?.image_main || null,
              quantity: apiItem.quantity || item.quantity,
              product: apiItem.product,
              variant: apiItem.variant
            };
            
            // Remplacer l'item local par l'item de l'API
            dispatch({ type: 'UPDATE_ITEM', payload: { oldId: item.id, newItem: formattedApiItem } });
          }
        } else {
          console.warn('Erreur API lors de l\'ajout au panier:', response.message);
        }
      } catch (error) {
        console.error('Erreur lors de l\'ajout au panier:', error);
      }
    }, 0); // Exécution immédiate mais asynchrone
  }, [cartSessionId])

  const removeItem = useCallback(async (itemId) => {
    // Supprimer localement IMMÉDIATEMENT pour la fluidité
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
    
    // Synchroniser avec l'API en arrière-plan
    if (cartSessionId) {
      setTimeout(async () => {
        try {
          const response = await cartService.removeFromCart(itemId, cartSessionId);
          if (!response.success) {
            console.warn('Erreur API lors de la suppression du panier:', response.message);
          }
        } catch (error) {
          console.error('Erreur lors de la suppression du panier:', error);
        }
      }, 0);
    }
  }, [cartSessionId])

  const updateQuantity = useCallback(async (itemId, quantity) => {
    // Mettre à jour localement IMMÉDIATEMENT pour la fluidité
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } });
    
    // Synchroniser avec l'API en arrière-plan
    if (cartSessionId) {
      setTimeout(async () => {
        try {
          const response = await cartService.updateCartItem(itemId, quantity, cartSessionId);
          if (!response.success) {
            console.warn('Erreur API lors de la mise à jour du panier:', response.message);
          }
        } catch (error) {
          console.error('Erreur lors de la mise à jour du panier:', error);
        }
      }, 0);
    }
  }, [cartSessionId])

  const clearCart = useCallback(() => {
    setIsUpdating(true);
    dispatch({ type: 'CLEAR_CART' });
    localStorage.removeItem('cart_state');
    setTimeout(() => setIsUpdating(false), 100);
  }, [])

  const replaceItems = useCallback((newItems) => {
    setIsUpdating(true);
    dispatch({ type: 'REPLACE_ITEMS', payload: newItems });
    setTimeout(() => setIsUpdating(false), 100);
  }, [])

  const updateItem = useCallback((oldId, newItem) => {
    setIsUpdating(true);
    dispatch({ type: 'UPDATE_ITEM', payload: { oldId, newItem } });
    setTimeout(() => setIsUpdating(false), 100);
  }, [])

  const value = {
    items: state.items,
    isUpdating,
    lastUpdate,
    cartSessionId,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    replaceItems,
    updateItem,
    getTotalItems,
    getTotalPrice
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
