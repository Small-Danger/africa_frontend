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
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg animate-pulse"></div>
            <h2 className="text-xl font-bold text-gray-900">Articles similaires</h2>
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
    <div className="space-y-8">
      {suggestionTypes.map(({ key, title, icon: Icon, description, maxItems }) => {
        const products = (suggestions[key] || []).slice(0, maxItems);
        
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
            
            {/* Grid de produits modernisé - Style uniforme avec ModernCatalog */}
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {products.map((product) => (
                  <Link 
                    key={product.id} 
                    to={`/products/${product.id}`}
                    className="group block h-full"
                  >
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 transform-gpu border border-gray-100 h-80 flex flex-col">
                      {/* Image du produit - Style moderne uniforme */}
                      <div className="h-48 bg-gray-50 relative overflow-hidden flex items-center justify-center flex-shrink-0">
                        <div className="w-full max-w-md mx-auto h-full flex items-center justify-center">
                          <img
                            src={product.image_main || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop'}
                            alt={product.name}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out rounded-lg"
                            style={{
                              imageRendering: 'high-quality',
                              WebkitImageRendering: 'high-quality'
                            }}
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        </div>
                        
                        {/* Image de fallback */}
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 items-center justify-center hidden">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <span className="text-gray-600 font-medium text-xs">Produit</span>
                          </div>
                        </div>
                        
                        {/* Badge de prix moderne */}
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 rounded-full shadow-lg">
                          <span className="text-sm font-bold">
                            {Math.round(Number(product.price || 0))} FCFA
                          </span>
                        </div>
                        
                        {/* Overlay au survol */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      
                      {/* Contenu du produit - Design épuré */}
                      <div className="p-4 flex-1 flex flex-col">
                        {/* Titre */}
                        <div className="mb-3">
                          <h3 className="font-bold text-gray-900 text-base line-clamp-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                            {product.name}
                          </h3>
                        </div>
                        
                        {/* Description */}
                        <div className="mb-4 flex-1">
                          {product.variant && (
                            <div className="mb-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {product.variant.name}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Footer avec prix et CTA */}
                        <div className="mt-auto">
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-bold text-blue-600">
                              {Math.round(Number(product.price || 0))} FCFA
                            </div>
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300 group-hover:scale-110">
                              <svg className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* Footer avec lien "Voir plus" */}
              <div className="mt-6 text-center">
                <button className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                  <span>Voir plus de suggestions</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductSuggestions;
