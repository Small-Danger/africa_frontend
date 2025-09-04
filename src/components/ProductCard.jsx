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
      className={`group block ${className}`}
    >
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
        {/* Image du produit */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={productImage}
            alt={productName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              console.error('Erreur de chargement image:', productImage);
              e.target.src = 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop';
            }}
          />
          
          {/* Actions rapides */}
          {showActions && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={handleToggleFavorite}
                className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-white transition-colors"
              >
                <Heart size={16} className="text-gray-600 hover:text-red-500" />
              </button>
            </div>
          )}

          {/* Badge de prix */}
          <div className="absolute bottom-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
            {formatPrice(minPrice)}
          </div>
        </div>

        {/* Informations du produit */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {productName}
          </h3>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {productDescription}
          </p>

          {/* Variantes et stock */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {variantsCount > 1 
                ? `${variantsCount} variantes disponibles`
                : 'En stock'
              }
            </span>
            
            {variantsCount > 0 && (
              <span className="text-blue-600 font-medium">
                À partir de {formatPrice(minPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
