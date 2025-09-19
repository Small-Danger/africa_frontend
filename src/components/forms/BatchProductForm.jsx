import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  PhotoIcon, 
  TrashIcon, 
  PlusIcon,
  CameraIcon,
  CurrencyEuroIcon,
  TagIcon,
  StarIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Select, SelectOption } from '../ui/Select';
import { productService, categoryService } from '../../services/api';

const BatchProductForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  categories = [], 
  loading = false,
  errors = {}
}) => {
  const [step, setStep] = useState(1); // 1: Sélection catégorie, 2: Création produits
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [products, setProducts] = useState([]);
  const [categoriesHierarchy, setCategoriesHierarchy] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // États pour la gestion des variantes
  const [includeVariants, setIncludeVariants] = useState(false);
  const [productVariants, setProductVariants] = useState({}); // { productIndex: [variants] }

  // Charger les catégories avec hiérarchie
  useEffect(() => {
    const loadCategories = async () => {
      if (Array.isArray(categories) && categories.length > 0) {
        setCategoriesHierarchy(categories);
        return;
      }

      try {
        setLoadingCategories(true);
        const response = await categoryService.getCategories();
        
        if (response.success) {
          let categoriesData = [];
          if (response.data && response.data.categories) {
            categoriesData = response.data.categories;
          } else if (Array.isArray(response.data)) {
            categoriesData = response.data;
          }
          setCategoriesHierarchy(categoriesData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (isOpen) {
      loadCategories();
    }
  }, [isOpen, categories]);

  // Formater les options de catégories de manière hiérarchique
  const formatCategoryOptions = () => {
    const options = [];
    
    if (!Array.isArray(categoriesHierarchy) || categoriesHierarchy.length === 0) {
      return options;
    }
    
    categoriesHierarchy.forEach(category => {
      options.push({
        value: category.id.toString(),
        label: `📁 ${category.name}`,
        disabled: false
      });
      
      if (category.subcategories && category.subcategories.length > 0) {
        category.subcategories.forEach(subcategory => {
          options.push({
            value: subcategory.id.toString(),
            label: `  └─ ${subcategory.name}`,
            disabled: false
          });
        });
      }
    });
    
    return options;
  };

  // Conversion de fichier en base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result;
        
        if (result && result.startsWith('data:')) {
          if (result.length > 100) {
            resolve(result);
          } else {
            reject(new Error('URL base64 trop courte'));
          }
        } else {
          reject(new Error('Format base64 invalide'));
        }
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  };

  // Gestion de l'upload d'image pour un produit
  const handleImageUpload = async (productIndex, files) => {
    if (files.length === 0) return;
    
    try {
      setUploading(true);
      const file = files[0];
      
      // Validation du fichier
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        throw new Error('L\'image est trop volumineuse (max 5MB)');
      }
      
      const base64 = await convertFileToBase64(file);
      
      setProducts(prev => prev.map((product, index) => 
        index === productIndex 
          ? { ...product, image_main: base64 }
          : product
      ));
    } catch (error) {
      console.error('Erreur conversion base64:', error);
      alert(`Erreur lors du traitement de l'image: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Ajouter une ligne de produit
  const addProduct = () => {
    setProducts(prev => [...prev, {
      name: '',
      description: '',
      base_price: '',
      image_main: null,
      is_active: true,
      sort_order: prev.length
    }]);
  };

  // Supprimer une ligne de produit
  const removeProduct = (index) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  // Mettre à jour un produit
  const updateProduct = (index, field, value) => {
    setProducts(prev => prev.map((product, i) => 
      i === index 
        ? { ...product, [field]: value }
        : product
    ));
  };

  // Validation des produits
  const validateProducts = () => {
    const errors = [];
    
    if (products.length === 0) {
      errors.push('Au moins un produit est requis');
      return errors;
    }
    
    products.forEach((product, index) => {
      if (!product.name.trim()) {
        errors.push(`Produit ${index + 1}: Le nom est obligatoire`);
      }
      if (!product.description.trim()) {
        errors.push(`Produit ${index + 1}: La description est obligatoire`);
      }
      if (!product.base_price || parseFloat(product.base_price) < 0) {
        errors.push(`Produit ${index + 1}: Le prix doit être un nombre positif`);
      }
      if (!product.image_main) {
        errors.push(`Produit ${index + 1}: L'image est obligatoire`);
      }
    });
    
    return errors;
  };

  // Fonctions de gestion des variantes
  const addVariantToProduct = (productIndex) => {
    const newVariant = {
      name: '',
      price: '',
      sku: '',
      stock_quantity: '',
      is_active: true,
      sort_order: 0
    };
    
    setProductVariants(prev => ({
      ...prev,
      [productIndex]: [...(prev[productIndex] || []), newVariant]
    }));
  };

  const removeVariantFromProduct = (productIndex, variantIndex) => {
    setProductVariants(prev => ({
      ...prev,
      [productIndex]: prev[productIndex]?.filter((_, index) => index !== variantIndex) || []
    }));
  };

  const updateVariant = (productIndex, variantIndex, field, value) => {
    setProductVariants(prev => ({
      ...prev,
      [productIndex]: prev[productIndex]?.map((variant, index) => 
        index === variantIndex ? { ...variant, [field]: value } : variant
      ) || []
    }));
  };

  const getProductVariants = (productIndex) => {
    return productVariants[productIndex] || [];
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!selectedCategoryId) {
        alert('Veuillez sélectionner une catégorie');
        return;
      }
      setStep(2);
      return;
    }
    
    // Étape 2: Validation et soumission
    const validationErrors = validateProducts();
    if (validationErrors.length > 0) {
      alert('Erreurs de validation:\n' + validationErrors.join('\n'));
      return;
    }
    
    const submitData = {
      category_id: parseInt(selectedCategoryId),
      products: products.map((product, index) => ({
        name: product.name.trim(),
        description: product.description.trim(),
        base_price: parseFloat(product.base_price),
        image_main: product.image_main,
        is_active: product.is_active,
        sort_order: index,
        // Inclure les variantes si l'option est activée
        ...(includeVariants && {
          variants: getProductVariants(index).map(variant => ({
            name: variant.name.trim(),
            price: parseFloat(variant.price) || 0,
            sku: variant.sku.trim(),
            stock_quantity: parseInt(variant.stock_quantity) || 0,
            is_active: variant.is_active,
            sort_order: variant.sort_order || 0
          }))
        })
      }))
    };
    
    // Debug: afficher les données envoyées
    console.log('Données envoyées pour création en lot:', JSON.stringify(submitData, null, 2));
    
    await onSubmit(submitData);
  };

  // Fermer le formulaire
  const handleClose = () => {
    setStep(1);
    setSelectedCategoryId('');
    setProducts([]);
    setProductVariants({});
    onClose();
  };

  // Retour à l'étape précédente
  const goBack = () => {
    setStep(1);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Créer plusieurs produits" 
      size="6xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Indicateur d'étapes */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <span className="text-sm font-medium">Sélectionner la catégorie</span>
          </div>
          
          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          
          <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
            <span className="text-sm font-medium">Créer les produits</span>
          </div>
        </div>

        {/* Étape 1: Sélection de catégorie */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sélectionnez la catégorie pour vos produits
              </h3>
              <p className="text-sm text-gray-600">
                Tous les produits créés seront associés à cette catégorie
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <TagIcon className="h-4 w-4 mr-2" />
                Catégorie *
              </label>
              <Select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full"
                disabled={loadingCategories}
                required
              >
                <SelectOption value="">Sélectionnez une catégorie</SelectOption>
                {formatCategoryOptions().map((option) => (
                  <SelectOption 
                    key={option.value} 
                    value={option.value}
                    disabled={option.disabled}
                    className={option.disabled ? 'text-gray-400' : ''}
                  >
                    {option.label}
                  </SelectOption>
                ))}
              </Select>
            </div>
          </div>
        )}

        {/* Étape 2: Création des produits */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Créer les produits
                </h3>
                <p className="text-sm text-gray-600">
                  Remplissez les informations pour chaque produit
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeVariants}
                    onChange={(e) => setIncludeVariants(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Inclure des variantes</span>
                </label>
                <Button
                  type="button"
                  onClick={addProduct}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Ajouter une ligne</span>
                </Button>
              </div>
            </div>

            {/* Tableau des produits */}
            {products.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Aucun produit ajouté. Cliquez sur "Ajouter une ligne" pour commencer.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-900">
                        Produit {index + 1}
                      </h4>
                      <Button
                        type="button"
                        onClick={() => removeProduct(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Colonne gauche - Informations textuelles */}
                      <div className="space-y-4">
                        {/* Nom du produit */}
                        <div>
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Nom du produit *
                        </label>
                          <Input
                            value={product.name}
                            onChange={(e) => updateProduct(index, 'name', e.target.value)}
                            placeholder="Entrez le nom du produit"
                            required
                          />
                        </div>

                        {/* Description */}
                        <div>
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Description *
                        </label>
                          <textarea
                            value={product.description}
                            onChange={(e) => updateProduct(index, 'description', e.target.value)}
                            placeholder="Décrivez votre produit..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>

                        {/* Prix de base */}
                        <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <CurrencyEuroIcon className="h-4 w-4 mr-2" />
                          Prix de base *
                        </label>
                          <Input
                            type="number"
                            value={product.base_price}
                            onChange={(e) => updateProduct(index, 'base_price', e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        {/* Statut actif */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`is_active_${index}`}
                            checked={product.is_active}
                            onChange={(e) => updateProduct(index, 'is_active', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`is_active_${index}`} className="ml-2 text-sm text-gray-900">
                            Produit actif
                          </label>
                        </div>
                      </div>

                      {/* Colonne droite - Image */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <PhotoIcon className="h-4 w-4 mr-2" />
                          Image principale *
                        </label>
                        
                        {product.image_main ? (
                          <div className="relative">
                            <img
                              src={product.image_main}
                              alt="Image principale"
                              className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => updateProduct(index, 'image_main', null)}
                              className="absolute top-2 right-2 bg-red-500 text-white hover:bg-red-600"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <CameraIcon className="mx-auto h-8 w-8 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleImageUpload(index, Array.from(e.target.files))}
                                />
                                Cliquez pour sélectionner une image
                              </label>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Formats : JPG, PNG, GIF, WEBP
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section des variantes - Interface compacte en lignes */}
                    {includeVariants && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-medium text-gray-900 flex items-center">
                            <CubeIcon className="h-4 w-4 mr-2" />
                            Variantes du produit
                            <span className="ml-2 text-xs text-gray-500">
                              ({getProductVariants(index).length}/5)
                            </span>
                          </h5>
                          <Button
                            type="button"
                            onClick={() => addVariantToProduct(index)}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1"
                            disabled={getProductVariants(index).length >= 5}
                          >
                            <PlusIcon className="h-3 w-3" />
                            <span>Ajouter</span>
                          </Button>
                        </div>

                        {getProductVariants(index).length === 0 ? (
                          <div className="text-center py-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                            <p className="text-xs text-gray-600">
                              Aucune variante. Cliquez sur "Ajouter" pour créer des variantes.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* En-tête du tableau compact */}
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                              <div className="col-span-3">Nom</div>
                              <div className="col-span-2">Prix</div>
                              <div className="col-span-2">SKU</div>
                              <div className="col-span-2">Stock</div>
                              <div className="col-span-2">Statut</div>
                              <div className="col-span-1">Action</div>
                            </div>
                            
                            {/* Lignes des variantes */}
                            {getProductVariants(index).map((variant, variantIndex) => (
                              <div key={variantIndex} className="grid grid-cols-12 gap-2 items-center bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
                                {/* Nom de la variante */}
                                <div className="col-span-3">
                                  <Input
                                    value={variant.name}
                                    onChange={(e) => updateVariant(index, variantIndex, 'name', e.target.value)}
                                    placeholder="Ex: Taille M"
                                    size="sm"
                                    className="text-xs"
                                  />
                                </div>
                                
                                {/* Prix */}
                                <div className="col-span-2">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={variant.price}
                                    onChange={(e) => updateVariant(index, variantIndex, 'price', e.target.value)}
                                    placeholder="0.00"
                                    size="sm"
                                    className="text-xs"
                                  />
                                </div>
                                
                                {/* SKU */}
                                <div className="col-span-2">
                                  <Input
                                    value={variant.sku}
                                    onChange={(e) => updateVariant(index, variantIndex, 'sku', e.target.value)}
                                    placeholder="SKU-001"
                                    size="sm"
                                    className="text-xs"
                                  />
                                </div>
                                
                                {/* Stock */}
                                <div className="col-span-2">
                                  <Input
                                    type="number"
                                    value={variant.stock_quantity}
                                    onChange={(e) => updateVariant(index, variantIndex, 'stock_quantity', e.target.value)}
                                    placeholder="0"
                                    size="sm"
                                    className="text-xs"
                                  />
                                </div>
                                
                                {/* Statut actif */}
                                <div className="col-span-2 flex items-center justify-center">
                                  <label className="flex items-center space-x-1 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={variant.is_active}
                                      onChange={(e) => updateVariant(index, variantIndex, 'is_active', e.target.checked)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                                    />
                                    <span className="text-xs text-gray-700">
                                      {variant.is_active ? 'Actif' : 'Inactif'}
                                    </span>
                                  </label>
                                </div>
                                
                                {/* Bouton supprimer */}
                                <div className="col-span-1 flex justify-center">
                                  <Button
                                    type="button"
                                    onClick={() => removeVariantFromProduct(index, variantIndex)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                                  >
                                    <TrashIcon className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            
                            {/* Message d'information sur la limite */}
                            {getProductVariants(index).length >= 5 && (
                              <div className="text-center py-2">
                                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">
                                  ⚠️ Limite de 5 variantes par produit atteinte
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Indicateur d'upload */}
            {uploading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Traitement des images...</p>
              </div>
            )}
          </div>
        )}

        {/* Actions du formulaire */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <div>
            {step === 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={loading}
              >
                Retour
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="flex items-center space-x-2"
            >
              <CheckIcon className="h-4 w-4" />
              <span>
                {step === 1 ? 'Continuer' : `Créer ${products.length} produit(s)`}
              </span>
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default BatchProductForm;
