import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const ProductCard = ({ product, showActions = true, className = '' }) => {
  // Fonctions utilitaires pour la sécurité des données
  const safeGet = (obj, path, defaultValue = '') => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === '') return '0 FCFA';
    const numPrice = Number(price);
    if (isNaN(numPrice)) return '0 FCFA';
    return `${Math.round(numPrice)} FCFA`;
  };

  const getProductImage = () => {
    try {
      // 1. Vérifier si le produit a des images
      if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
        const firstImage = product.images[0];
        if (firstImage && typeof firstImage === 'string' && firstImage.trim() !== '') {
          return firstImage;
        }
      }
      
      // 2. Vérifier l'image principale du produit
      if (product?.image_main && typeof product.image_main === 'string' && product.image_main.trim() !== '') {
        return product.image_main;
      }
      
      // 3. Vérifier l'image de la catégorie
      if (product?.category?.image_main && typeof product.category.image_main === 'string') {
        return product.category.image_main;
      }
      
      // 4. Image par défaut
      return 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop';
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'image:', error);
      return 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop';
    }
  };

  const getMinPrice = () => {
    try {
      if (product?.variants && Array.isArray(product.variants) && product.variants.length > 0) {
        const prices = product.variants
          .filter(v => v && v.price !== null && v.price !== undefined)
          .map(v => Number(v.price))
          .filter(price => !isNaN(price));
        
        if (prices.length > 0) {
          return Math.min(...prices);
        }
      }
      
      // Utiliser le prix de base du produit
      return safeGet(product, 'base_price', 0) || safeGet(product, 'price', 0);
    } catch (error) {
      console.error('Erreur lors du calcul du prix minimum:', error);
      return 0;
    }
  };

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Ici vous pouvez ajouter la logique pour ajouter aux favoris
    console.log('Ajouter aux favoris:', safeGet(product, 'name', 'Produit'));
  };

  // Vérification de sécurité pour le produit
  if (!product || !product.id) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}>
        <div className="p-4 text-center text-gray-500">
          <p>Produit non disponible</p>
        </div>
      </div>
    );
  }

  const productImage = getProductImage();
  const minPrice = getMinPrice();
  const productName = safeGet(product, 'name', 'Nom du produit');
  const productDescription = safeGet(product, 'description', 'Aucune description disponible');
  const variantsCount = product?.variants?.length || 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className={`group block h-full ${className}`}
    >
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:scale-105 h-full flex flex-col">
        {/* Image du produit - Hauteur fixe comme les catégories */}
        <div className="relative h-32 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
          {productImage ? (
            <div className="w-full max-w-md mx-auto h-full flex items-center justify-center">
              <img
                src={productImage}
                alt={productName}
                className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-110 rounded-lg"
                onError={(e) => {
                  console.error('Erreur de chargement image:', productImage);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            </div>
          ) : null}
          
          {/* Fallback si pas d'image */}
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-blue-600 font-medium text-xs">Produit</span>
            </div>
          </div>
          
          {/* Badge de prix */}
          <div className="absolute bottom-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-md">
            {formatPrice(minPrice)}
          </div>
        </div>
        
        {/* Contenu du produit - Flex pour occuper l'espace restant */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{productName}</h3>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{productDescription}</p>
          </div>
          
          {/* Footer avec statut */}
          <div className="mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 font-medium">
                {variantsCount > 1 
                  ? `${variantsCount} variantes`
                  : 'En stock'
                }
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
