import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, Clock, Plus, ShoppingCart } from 'lucide-react';
import { suggestionService, cartService } from '../services/api';
import { useCart } from '../contexts/CartContext';

const ProductSuggestions = ({ productId, cartSessionId }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});
  const { addItem } = useCart();

  useEffect(() => {
    if (productId) {
      loadSuggestions();
    }
  }, [productId]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await suggestionService.getSimilarProducts(productId);
      
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Articles similaires</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="w-full h-24 sm:h-32 bg-gray-200 rounded-lg mb-2 sm:mb-3"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded mb-1 sm:mb-2"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-2/3"></div>
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
      key: 'similar_products',
      title: 'Articles similaires',
      icon: Star,
      description: 'Dans la même catégorie',
      maxItems: 6
    },
    {
      key: 'popular_in_category',
      title: 'Populaires dans cette catégorie',
      icon: TrendingUp,
      description: 'Les plus vendus',
      maxItems: 4
    },
    {
      key: 'recent_products',
      title: 'Nouveautés',
      icon: Clock,
      description: 'Derniers ajouts',
      maxItems: 4
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {suggestionTypes.map(({ key, title, icon: Icon, description, maxItems }) => {
        const products = (suggestions[key] || []).slice(0, maxItems);
        
        if (products.length === 0) return null;

        return (
          <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <Icon size={18} className="text-blue-600" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">{description}</p>
            </div>
            
            <div className="p-3 sm:p-4 lg:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
                {products.map((product) => (
                  <div key={product.id} className="group border border-gray-200 rounded-lg p-2 sm:p-3 hover:shadow-md transition-all duration-200 hover:border-blue-300">
                    <Link to={`/products/${product.id}`} className="block">
                      <div className="w-full h-20 sm:h-24 lg:h-28 bg-gray-100 rounded-lg mb-2 sm:mb-3 overflow-hidden">
                        <img
                          src={product.image_main || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <h3 className="font-medium text-gray-900 text-xs sm:text-sm mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-blue-600 font-semibold text-xs sm:text-sm mb-1 sm:mb-2">
                        {formatPrice(product.price)}
                      </p>
                      {product.variant && (
                        <p className="text-xs text-gray-500 mb-1 sm:mb-2">
                          {product.variant.name}
                        </p>
                      )}
                    </Link>
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(product);
                      }}
                      disabled={addingToCart[product.id] || !product.is_available}
                      className="w-full bg-blue-600 text-white py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1"
                    >
                      {addingToCart[product.id] ? (
                        <>
                          <div className="animate-spin rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 border-2 border-white border-t-transparent"></div>
                          <span className="hidden sm:inline">Ajout...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={10} className="sm:hidden" />
                          <ShoppingCart size={12} className="hidden sm:block" />
                          <span className="hidden sm:inline">Ajouter</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductSuggestions;
