import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, TrendingUp, Star, Clock, Plus } from 'lucide-react';
import { suggestionService, cartService } from '../services/api';
import { useCart } from '../contexts/CartContext';

const CartSuggestions = ({ cartSessionId }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});
  const { addItem } = useCart();

  useEffect(() => {
    loadSuggestions();
  }, [cartSessionId]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = {};
      if (cartSessionId) {
        headers['X-Session-ID'] = cartSessionId;
      }

      const response = await suggestionService.getCartSuggestions(headers);
      
      if (response.success) {
        setSuggestions(response.data);
      } else {
        setError('Erreur lors du chargement des suggestions');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des suggestions:', err);
      setError('Erreur lors du chargement des suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    const productId = product.id;
    setAddingToCart(prev => ({ ...prev, [productId]: true }));

    try {
      // Préparer l'item pour le contexte
      const itemToAdd = {
        id: product.variant ? `${product.id}_${product.variant.id}` : product.id,
        product_id: product.id,
        variant_id: product.variant?.id,
        name: product.name,
        price: product.price,
        unit_price: product.price,
        image: product.image_main,
        quantity: 1,
        product: product,
        variant: product.variant
      };

      // Ajout instantané dans le contexte
      addItem(itemToAdd);

      // Synchronisation avec l'API en arrière-plan
      const headers = {};
      if (cartSessionId) {
        headers['X-Session-ID'] = cartSessionId;
      }

      const cartData = {
        product_id: product.id,
        variant_id: product.variant?.id,
        quantity: 1
      };

      await cartService.addToCart(cartData, headers);
    } catch (err) {
      console.error('Erreur lors de l\'ajout au panier:', err);
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === '') return '0 FCFA';
    const numPrice = Number(price);
    if (isNaN(numPrice)) return '0 FCFA';
    return `${Math.round(numPrice)} FCFA`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg animate-pulse"></div>
            <h2 className="text-xl font-bold text-gray-900">Suggestions d'articles</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">Découvrez des produits qui pourraient vous intéresser</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="w-full h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !suggestions) {
    return null;
  }

  const suggestionTypes = [
    {
      key: 'complementary',
      title: 'Articles complémentaires',
      icon: ShoppingCart,
      description: 'Parfait avec vos articles'
    },
    {
      key: 'frequently_bought_together',
      title: 'Fréquemment achetés ensemble',
      icon: TrendingUp,
      description: 'Autres clients ont aussi acheté'
    },
    {
      key: 'similar_products',
      title: 'Articles similaires',
      icon: Star,
      description: 'Dans la même catégorie'
    },
    {
      key: 'popular_products',
      title: 'Articles populaires',
      icon: TrendingUp,
      description: 'Les plus vendus'
    },
    {
      key: 'recent_products',
      title: 'Nouveautés',
      icon: Clock,
      description: 'Derniers ajouts'
    }
  ];

  return (
    <div className="space-y-8">
      {suggestionTypes.map(({ key, title, icon: Icon, description }) => {
        const products = suggestions[key] || [];
        
        if (products.length === 0) return null;

        return (
          <div key={key} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header moderne style Amazon/Shein */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                  <span>{products.length} produit{products.length > 1 ? 's' : ''}</span>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>
            
            {/* Grid de produits modernisé */}
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="group block relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1 transform-gpu"
                  >
                    {/* Image container avec effet moderne */}
                    <div className="relative h-32 bg-gray-50 overflow-hidden">
                      <div className="w-full max-w-md mx-auto h-full flex items-center justify-center">
                        <img
                          src={product.image_main || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 rounded-lg"
                        />
                      </div>
                      
                      {/* Overlay au survol */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    
                    {/* Contenu du produit */}
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                        {product.name}
                      </h3>
                      
                      {/* Prix principal */}
                      <div className="mb-3">
                        <span className="text-lg font-bold text-blue-600">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      
                      {/* Variant info */}
                      {product.variant && (
                        <div className="mb-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {product.variant.name}
                          </span>
                        </div>
                      )}
                      
                      {/* Bouton d'ajout au panier modernisé */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        disabled={addingToCart[product.id] || !product.is_available}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-3 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                      >
                        {addingToCart[product.id] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Ajout...</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={16} />
                            <span>Ajouter</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Effet de brillance au survol */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </Link>
                ))}
              </div>
              
              {/* Footer avec lien "Voir plus" */}
              <div className="mt-6 text-center">
                <Link 
                  to="/catalog" 
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                >
                  <span>Voir plus de suggestions</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CartSuggestions;
