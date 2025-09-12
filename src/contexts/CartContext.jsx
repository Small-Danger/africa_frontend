import { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react'

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

  const addItem = useCallback((item) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  }, [])

  const removeItem = useCallback((itemId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  }, [])

  const updateQuantity = useCallback((itemId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } });
  }, [])

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
