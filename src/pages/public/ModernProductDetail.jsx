import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  ArrowLeft,
  X,
  CheckCircle
} from 'lucide-react';
import { productService, categoryService, cartService } from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import ProductSuggestions from '../../components/ProductSuggestions';
import { ShimmerTextVariants } from '../../components/ShimmerText';

const ModernProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, updateItem } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [cartSessionId, setCartSessionId] = useState(localStorage.getItem('cart_session_id'));
  
  // Log initial pour débogage
  console.log('🎯 ModernProductDetail - Composant monté');
  console.log('🆔 ID depuis useParams:', id);
  
  // Cache pour éviter les requêtes redondantes
  const productCacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);
  
  // Cache persistant de session
  const SESSION_CACHE_KEY = 'bs_shop_product_cache';
  const SESSION_CACHE_TTL = 60 * 60 * 1000; // 1 heure

  // Fonctions utilitaires pour la sécurité des données
  const safeGet = useCallback((obj, path, defaultValue = '') => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  }, []);

  const formatPrice = useCallback((price) => {
    if (price === null || price === undefined || price === '') return '0 FCFA';
    const numPrice = Number(price);
    if (isNaN(numPrice)) return '0 FCFA';
    return `${Math.round(numPrice)} FCFA`;
  }, []);

  const getProductImages = useCallback(() => {
    if (!product) return [];
    
    try {
      let images = [];
      
      // 1. Priorité à l'image principale du produit
      if (product.image_main && typeof product.image_main === 'string' && product.image_main.trim() !== '') {
        images.push(product.image_main);
      }
      
      // 2. Ajouter les images du produit depuis la relation images
      if (product.images && Array.isArray(product.images)) {
        const productImages = product.images.map(img => {
          if (typeof img === 'string') {
            return img;
          } else if (img && typeof img === 'object' && img.media_path) {
            return img.media_path;
          }
          return null;
        }).filter(img => img && img.trim() !== '');
        
        // Éviter les doublons avec l'image principale
        productImages.forEach(img => {
          if (!images.includes(img)) {
            images.push(img);
          }
        });
      }
      
      // 3. Si aucune image n'est trouvée, utiliser une image par défaut
      if (images.length === 0) {
        images = ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop'];
      }
      
      return images;
    } catch (error) {
      console.error('Erreur lors de la récupération des images:', error);
      return ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop'];
    }
  }, [product]);

  // Charger les données avec timeout de sécurité
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    
    const loadData = async () => {
      console.log('🚀 ModernProductDetail - useEffect déclenché');
      console.log('📋 ID reçu:', id);
      console.log('📋 Type ID:', typeof id);
      
      if (!id) {
        console.warn('⚠️ Aucun ID fourni');
        setError('ID de produit manquant');
        setLoading(false);
        return;
      }
      
      // Vérifier que l'ID est un nombre valide
      if (isNaN(Number(id))) {
        console.warn('⚠️ ID invalide:', id);
        setError('ID de produit invalide');
        setLoading(false);
        return;
      }
      
      // Timeout de sécurité pour éviter le blocage
      timeoutId = setTimeout(() => {
        if (isMounted) {
          console.warn('⏰ Timeout de chargement atteint, arrêt du chargement');
          setLoading(false);
          setError('Délai de chargement dépassé. Veuillez réessayer.');
        }
      }, 10000); // 10 secondes max
      
      // Cache désactivé - chargement direct depuis l'API
      console.log('🔄 Chargement direct du produit depuis l\'API (cache désactivé)');

      // Annuler la requête précédente
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }
        
        console.log('🔄 Chargement du produit ID:', id);
        console.log('🌐 Appel API vers productService.getProduct...');
        
        // Charger le produit d'abord (priorité)
        const productResponse = await productService.getProduct(id);
        
        console.log('📡 Réponse API reçue:', productResponse);
        
        if (!isMounted) {
          console.log('⚠️ Composant démonté, arrêt du traitement');
          return;
        }
        
        if (productResponse.success && productResponse.data) {
          console.log('✅ Produit trouvé:', productResponse.data);
          const productData = productResponse.data;
          setProduct(productData);
          
          // Sélectionner la première variante disponible
          console.log('🔍 Variantes reçues du produit:', productData.variants);
          if (productData.variants && Array.isArray(productData.variants) && productData.variants.length > 0) {
            const validVariants = productData.variants.filter(v => v && v.id && v.name && (v.is_active !== false));
            console.log('✅ Variantes valides filtrées:', validVariants);
            if (validVariants.length > 0) {
              const availableVariant = validVariants[0];
              console.log('🎯 Variante sélectionnée automatiquement:', availableVariant);
              setSelectedVariant(availableVariant);
            }
          }
          
          // Cache désactivé - pas de sauvegarde
          console.log('💾 Cache désactivé - produit non sauvegardé');
          
          console.log('✅ Produit chargé avec succès');
        } else {
          console.error('❌ Erreur produit:', productResponse);
          setError('Produit non trouvé ou données invalides');
        }
        
        // Charger les catégories en arrière-plan (non bloquant)
        loadCategoriesInBackground();
        
      } catch (err) {
        if (isMounted) {
          console.error('❌ Erreur lors du chargement du produit:', err);
          setError(`Erreur lors du chargement: ${err.message}`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          clearTimeout(timeoutId);
        }
      }
    };
    
    // Fonction pour charger les catégories en arrière-plan
    const loadCategoriesInBackground = async () => {
      try {
        const categoriesCacheKey = 'bs_shop_categories_cache';
        const categoriesCached = sessionStorage.getItem(categoriesCacheKey);
        
        if (categoriesCached) {
          const { data, timestamp } = JSON.parse(categoriesCached);
          if (Date.now() - timestamp < SESSION_CACHE_TTL) {
            if (isMounted) {
              setCategories(data);
            }
            return;
          }
        }
        
        const response = await categoryService.getCategories();
        if (response.success && isMounted) {
          let categoriesData = [];
          if (response.data && response.data.categories) {
            categoriesData = response.data.categories;
          } else if (Array.isArray(response.data)) {
            categoriesData = response.data;
          }
          setCategories(categoriesData);
          
          // Mettre en cache
          try {
            const categoriesData = {
              data: categoriesData,
              timestamp: Date.now()
            };
            sessionStorage.setItem(categoriesCacheKey, JSON.stringify(categoriesData));
          } catch (error) {
            console.warn('Erreur lors de la sauvegarde du cache des catégories:', error);
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des catégories en arrière-plan:', err);
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id]);

  const getCategoryInfo = () => {
    if (!product || !categories.length) {
      return { 
        category: { name: 'Catégorie', images: [], image_main: null },
        subcategory: { name: 'Sous-catégorie', images: [], image_main: null }
      };
    }
    
    try {
      for (const category of categories) {
        if (category && category.subcategories && Array.isArray(category.subcategories)) {
          for (const subcategory of category.subcategories) {
            if (subcategory && subcategory.id === product.category_id) {
              return { 
                category: {
                  name: category.name || 'Catégorie',
                  images: category.images || [],
                  image_main: category.image_main || null
                },
                subcategory: {
                  name: subcategory.name || 'Sous-catégorie',
                  images: subcategory.images || [],
                  image_main: subcategory.image_main || null
                }
              };
            }
          }
        }
        if (category && category.id === product.category_id) {
          return { 
            category: {
              name: category.name || 'Catégorie',
              images: category.images || [],
              image_main: category.image_main || null
            },
            subcategory: {
              name: 'Général',
              images: [],
              image_main: null
            }
          };
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des informations de catégorie:', error);
    }
    
    return { 
      category: { name: 'Catégorie', images: [], image_main: null },
      subcategory: { name: 'Sous-catégorie', images: [], image_main: null }
    };
  };

  const getCategoryName = () => {
    const categoryInfo = getCategoryInfo();
    return {
      category: categoryInfo.category.name,
      subcategory: categoryInfo.subcategory.name
    };
  };

  const nextImage = () => {
    const images = getProductImages();
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = getProductImages();
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index) => {
    const images = getProductImages();
    if (index >= 0 && index < images.length) {
      setCurrentImageIndex(index);
    }
  };

  const handleAddToCart = async () => {
    console.log('🛒 Tentative d\'ajout au panier');
    console.log('📦 Produit:', product);
    console.log('🎯 Variante sélectionnée:', selectedVariant);
    console.log('📊 Variantes disponibles:', product?.variants);
    
    if (!product) {
      setError('Produit non trouvé');
      return;
    }
    
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      if (!selectedVariant) {
        setError('Veuillez sélectionner une variante');
        return;
      }
    }
    
    try {
      setAddingToCart(true);
      setError(null);
      
      // Préparer l'item pour le contexte
      const itemToAdd = {
        id: selectedVariant ? `${product.id}_${selectedVariant.id}` : product.id,
        product_id: product.id,
        variant_id: selectedVariant?.id,
        name: product.name,
        price: selectedVariant ? selectedVariant.price : product.base_price,
        image: product.image_main,
        quantity: quantity
      };
      
      console.log('🛒 Élément à ajouter au panier:', itemToAdd);
      
      // Ajout instantané dans le contexte (UI réactive)
      addItem(itemToAdd);
      
      // Afficher le succès immédiatement
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Synchronisation avec l'API en arrière-plan (sans bloquer l'UI)
      let cartData;
      if (selectedVariant) {
        cartData = {
          product_id: product.id,
          variant_id: selectedVariant.id,
          quantity: quantity
        };
      } else {
        cartData = {
          product_id: product.id,
          quantity: quantity,
        };
      }
      
      const headers = {};
      if (cartSessionId) {
        headers['X-Session-ID'] = cartSessionId;
      }
      
      // Faire la requête API en arrière-plan
      cartService.addToCart(cartData, headers)
        .then(response => {
          if (response && response.success) {
            if (response.data?.session_id) {
              const newSessionId = response.data.session_id;
              setCartSessionId(newSessionId);
              localStorage.setItem('cart_session_id', newSessionId);
            }
            
            // Mettre à jour l'article local avec les vraies données de l'API
            if (response.data?.cart_item) {
              const apiItem = response.data.cart_item;
              const formattedApiItem = {
                id: apiItem.id, // ID réel de la base de données
                product_id: apiItem.product?.id || apiItem.product_id,
                variant_id: apiItem.variant?.id || apiItem.variant_id,
                name: apiItem.product?.name || 'Nom du produit',
                price: apiItem.unit_price || (apiItem.variant?.price || apiItem.product?.base_price || 0),
                unit_price: apiItem.unit_price || (apiItem.variant?.price || apiItem.product?.base_price || 0),
                image: apiItem.product?.image_main || null,
                quantity: apiItem.quantity || quantity,
                product: apiItem.product,
                variant: apiItem.variant
              };
              
              console.log('🔄 Mise à jour de l\'article local avec les données de l\'API:', {
                oldId: itemToAdd.id,
                newItem: formattedApiItem
              });
              
              // Remplacer l'article local par l'article de l'API
              updateItem(itemToAdd.id, formattedApiItem);
            }
          } else {
            console.warn('Erreur API lors de l\'ajout au panier:', response);
          }
        })
        .catch(err => {
          console.error('Erreur API lors de l\'ajout au panier:', err);
        });
        
    } catch (err) {
      console.error('❌ Exception lors de l\'ajout au panier:', err);
      setError(`Erreur lors de l'ajout au panier: ${err.message}`);
    } finally {
      setAddingToCart(false);
    }
  };

  // Composant de notification de succès
  const SuccessNotification = () => (
    <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center space-x-3 animate-in slide-in-from-right duration-300">
      <div className="flex-1">
        <h4 className="font-semibold">Produit ajouté au panier !</h4>
        <p className="text-sm opacity-90">Voulez-vous voir votre panier ?</p>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => navigate('/cart')}
          className="bg-white text-green-600 px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
        >
          Voir le panier
        </button>
        <button
          onClick={() => setShowSuccess(false)}
          className="text-white hover:text-green-100 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );

  // Affichage du chargement optimisé
  if (loading) {
    return <ShimmerTextVariants.PageLoader subtitle="Chargement du produit..." />;
  }

  // Fonction pour recharger les données
  const retryLoad = () => {
    setError(null);
    setLoading(true);
    // Forcer le rechargement en nettoyant le cache
    const sessionCacheKey = `${SESSION_CACHE_KEY}_${id}`;
    sessionStorage.removeItem(sessionCacheKey);
    const cacheKey = `product_${id}`;
    productCacheRef.current.delete(cacheKey);
    // Le useEffect se déclenchera automatiquement
  };

  // Affichage de l'erreur
  if (error || (!product && !loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Produit non trouvé'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error === 'Délai de chargement dépassé. Veuillez réessayer.' 
              ? 'Le chargement a pris trop de temps. Vérifiez votre connexion.'
              : 'Impossible de charger ce produit. Vérifiez que l\'ID est correct.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={retryLoad}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              🔄 Réessayer
            </button>
            <Link 
              to="/catalog" 
              className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Retour au catalogue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { category, subcategory } = getCategoryName();
  const productImages = getProductImages();
  
  if (!product || !product.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Produit non trouvé</h2>
          <Link to="/catalog" className="text-blue-600 hover:text-blue-700">
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Notification de succès */}
      {showSuccess && <SuccessNotification />}

      {/* Breadcrumb moderne en haut - Mobile first optimisé */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none flex-1 min-w-0">
              <Link 
                to="/catalog" 
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 md:py-2 bg-blue-50 text-blue-700 rounded-lg font-medium transition-all duration-200 hover:bg-blue-100 active:scale-95 whitespace-nowrap text-xs sm:text-sm touch-manipulation"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Accueil</span>
              </Link>
              
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              <Link 
                to="/catalog" 
                className="px-2 sm:px-3 py-1 sm:py-1.5 md:py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 active:scale-95 whitespace-nowrap text-xs sm:text-sm touch-manipulation"
              >
                <span>Catalogue</span>
              </Link>
              
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              <Link 
                to={`/catalog/${category.toLowerCase().replace(' ', '-')}`} 
                className="px-2 sm:px-3 py-1 sm:py-1.5 md:py-2 bg-gray-100 text-gray-900 rounded-lg font-medium whitespace-nowrap text-xs sm:text-sm"
              >
                <span className="truncate max-w-16 sm:max-w-20 md:max-w-none">{category}</span>
              </Link>
              
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              <div className="px-2 sm:px-3 py-1 sm:py-1.5 md:py-2 bg-blue-100 text-blue-900 rounded-lg font-medium whitespace-nowrap text-xs sm:text-sm">
                <span className="truncate max-w-16 sm:max-w-20 md:max-w-none">{subcategory}</span>
              </div>
            </div>
            
            <button 
              onClick={() => window.history.back()}
              className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-all duration-200 active:scale-95 ml-1 sm:ml-2 md:ml-3 flex-shrink-0 touch-manipulation"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Container principal avec max-width et espacement du header - Mobile first */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Carousel d'images moderne - Mobile optimisé */}
        <div className="relative bg-white mb-3 sm:mb-4 rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg sm:shadow-xl border border-gray-100">
          <div className="relative h-72 sm:h-80 md:h-96 lg:h-[24rem] overflow-hidden bg-gray-50 flex items-center justify-center">
          {productImages.length > 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={productImages[currentImageIndex]}
                alt={`${safeGet(product, 'name', 'Produit')} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover object-center transition-all duration-500 ease-in-out hover:scale-105 cursor-zoom-in"
                style={{
                  imageRendering: 'high-quality',
                  WebkitImageRendering: 'high-quality',
                  filter: 'contrast(1.1) saturate(1.1)'
                }}
                loading="eager"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            </div>
          ) : null}
          
          {/* Image de fallback améliorée */}
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 ${productImages.length > 0 ? 'hidden' : 'flex'}`}>
            <div className="text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-gray-500 text-sm sm:text-base font-medium">Aucune image disponible</span>
            </div>
          </div>
          
          {/* Boutons de navigation du carousel - Mobile first optimisés */}
          {productImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 sm:left-3 md:left-4 top-1/2 transform -translate-y-1/2 bg-white/95 backdrop-blur-sm p-2.5 sm:p-3 rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110 touch-manipulation active:scale-95"
              >
                <ChevronLeft size={20} className="text-gray-700 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 sm:right-3 md:right-4 top-1/2 transform -translate-y-1/2 bg-white/95 backdrop-blur-sm p-2.5 sm:p-3 rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110 touch-manipulation active:scale-95"
              >
                <ChevronRight size={20} className="text-gray-700 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </button>
            </>
          )}
          
          {/* Indicateur de position - Mobile first optimisé */}
          {productImages.length > 1 && (
            <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 bg-black/80 backdrop-blur-sm text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
              {currentImageIndex + 1} / {productImages.length}
            </div>
          )}
        </div>
        
        {/* Indicateurs de navigation (points) - Mobile first optimisés */}
        {productImages.length > 1 && (
          <div className="flex justify-center space-x-1.5 sm:space-x-2 py-2 sm:py-3 md:py-4">
            {productImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-200 touch-manipulation active:scale-90 ${
                  index === currentImageIndex 
                    ? 'bg-blue-600 scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
        
        {/* Grille des miniatures - Mobile first optimisée */}
        {productImages.length > 1 && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 bg-gray-50">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3 max-w-lg mx-auto">
              {productImages.map((image, index) => (
                <div 
                  key={`thumbnail-${index}`}
                  className={`relative group cursor-pointer overflow-hidden rounded-lg sm:rounded-xl border-2 transition-all duration-200 shadow-sm touch-manipulation active:scale-95 ${
                    index === currentImageIndex 
                      ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg scale-105' 
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md hover:scale-105'
                  }`}
                  onClick={() => goToImage(index)}
                >
                  <img
                    src={image}
                    alt={`${safeGet(product, 'name', 'Produit')} - Miniature ${index + 1}`}
                    className="w-full h-16 sm:h-20 md:h-24 object-cover object-center group-hover:scale-110 transition-transform duration-200"
                    style={{
                      imageRendering: 'high-quality',
                      WebkitImageRendering: 'high-quality',
                      filter: 'contrast(1.05) saturate(1.05)'
                    }}
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  
                  {/* Image de fallback pour les miniatures - Mobile optimisée */}
                  <div className="w-full h-16 sm:h-20 md:h-24 bg-gradient-to-br from-gray-200 to-gray-300 items-center justify-center hidden">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  
                  {/* Overlay au survol avec effet de zoom - Desktop seulement */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 sm:group-hover:opacity-100 transition-all duration-200 items-center justify-center hidden sm:flex">
                    <div className="opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 transform sm:group-hover:scale-110">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Indicateur de sélection amélioré - Mobile optimisé */}
                  {index === currentImageIndex && (
                    <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-lg ring-1 sm:ring-2 ring-white">
                      <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Informations produit modernisées - Alignées avec l'image */}
      <div className="px-3 sm:px-4 mb-4 sm:mb-5">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl border border-gray-100 p-4 sm:p-6 md:p-8">
          {/* Titre et note - Mobile first */}
          <div className="mb-3 sm:mb-4 md:mb-6">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">{safeGet(product, 'name', 'Nom du produit')}</h1>
          </div>

          {/* Prix - Mobile optimisé */}
          <div className="mb-3 sm:mb-4 md:mb-6">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
              {selectedVariant ? formatPrice(selectedVariant.price) : formatPrice(safeGet(product, 'base_price', 0))}
            </span>
          </div>

          {/* Description - Mobile first */}
          <div className="mb-3 sm:mb-4 md:mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Description</h3>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{safeGet(product, 'description', 'Aucune description disponible')}</p>
          </div>

          {/* Sélection de variante - Mobile first optimisée */}
          {(() => {
            try {
              const variants = safeGet(product, 'variants', []);
              const validVariants = variants && Array.isArray(variants) 
                ? variants.filter(v => v && v.id && v.name && typeof v.name === 'string' && (v.is_active !== false))
                : [];
              
              if (validVariants.length > 0) {
                return (
                  <div className="mb-3 sm:mb-4 md:mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Choisir une variante</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {validVariants.map((variant) => (
                        <button
                          key={variant.id || `variant-${Math.random()}`}
                          onClick={() => setSelectedVariant(variant)}
                          className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all touch-manipulation active:scale-95 ${
                            selectedVariant?.id === variant.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-medium text-sm sm:text-base">{variant.name || 'Variante'}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            } catch (error) {
              return null;
            }
          })()}

          {/* Sélection de quantité - Mobile first optimisée */}
          <div className="mb-3 sm:mb-4 md:mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Quantité</h3>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors text-base sm:text-lg font-medium touch-manipulation active:scale-95"
              >
                -
              </button>
              <span className="w-16 sm:w-20 text-center font-bold text-gray-900 text-base sm:text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors text-base sm:text-lg font-medium touch-manipulation active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {/* Bouton d'ajout au panier - Mobile first optimisé */}
          <div className="mb-3 sm:mb-4 md:mb-6">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || (product.variants && product.variants.length > 0 && !selectedVariant)}
              className="w-full bg-blue-600 text-white py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl md:rounded-3xl font-bold text-sm sm:text-base md:text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl flex items-center justify-center space-x-2 sm:space-x-3 touch-manipulation active:scale-95"
            >
              {addingToCart ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 border-2 border-white border-t-transparent"></div>
                  <span className="text-xs sm:text-sm md:text-base">Ajout en cours...</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  <span className="text-xs sm:text-sm md:text-base">
                    {(() => {
                      if (product.variants && product.variants.length > 0 && !selectedVariant) {
                        return 'Sélectionnez une variante';
                      } else if (selectedVariant) {
                        return `Ajouter - ${formatPrice(safeGet(selectedVariant, 'price', 0) * quantity)}`;
                      } else {
                        return `Ajouter - ${formatPrice(safeGet(product, 'base_price', 0) * quantity)}`;
                      }
                    })()}
                  </span>
                </>
              )}
            </button>
            
            {/* Message d'aide si pas de variante sélectionnée - Mobile optimisé */}
            {product.variants && product.variants.length > 0 && !selectedVariant && (
              <p className="text-center text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
                ⚠️ Veuillez sélectionner une variante avant d'ajouter au panier
              </p>
            )}
            
            {/* Message d'aide pour les produits sans variante */}
            {(!product.variants || product.variants.length === 0) && (
              <p className="text-center text-xs sm:text-sm text-green-600 mt-2 sm:mt-3">
              </p>
            )}
          </div>

          {/* Affichage des erreurs - Mobile optimisé */}
          {error && (
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl">
              <p className="text-red-600 text-xs sm:text-sm">
                <span className="font-medium">Erreur :</span> {error}
              </p>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Section suggestions d'articles similaires - Mobile first optimisée */}
      <div className="px-3 sm:px-4 pb-4 sm:pb-5">
        <div className="max-w-7xl mx-auto">
          <ProductSuggestions productId={id} cartSessionId={cartSessionId} />
        </div>
      </div>

      {/* Styles CSS modernes - Mobile first optimisés */}
      <style jsx>{`
        /* Optimisations mobile-first */
        @media (max-width: 640px) {
          .touch-manipulation {
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }
          
          /* Amélioration des zones tactiles */
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Optimisation des transitions pour mobile */
          .group:active {
            transform: scale(0.98);
            transition: transform 0.1s ease-out;
          }
          
          /* Amélioration de la lisibilité sur mobile */
          .text-shadow-mobile {
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }
          
          /* Scrollbar personnalisée pour mobile */
          .scrollbar-none {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          .scrollbar-none::-webkit-scrollbar {
            display: none;
          }
        }
        
        /* Optimisations pour tablettes */
        @media (min-width: 641px) and (max-width: 1024px) {
          .group:hover {
            transform: translateY(-2px) scale(1.01);
          }
        }
        
        /* Optimisations pour desktop */
        @media (min-width: 1025px) {
          .group:hover {
            transform: translateY(-4px) scale(1.02);
          }
        }
        
        /* Animations fluides */
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Effet de parallaxe subtil pour les images */
        .parallax-bg {
          background-attachment: fixed;
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
        }
        
        /* Amélioration du contraste des textes */
        .text-shadow {
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        /* Focus ring pour l'accessibilité */
        .focus-ring:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default ModernProductDetail;
