import React, { useState, useEffect, useCallback } from 'react';
import { 
  XMarkIcon, 
  PhotoIcon, 
  TrashIcon, 
  PlusIcon,
  CameraIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  TagIcon,
  StarIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Select, SelectOption } from '../ui/Select';
import Badge from '../ui/Badge';
import { categoryService } from '../../services/api';

const ProductForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  product = null, 
  categories = [], 
  loading = false,
  errors = {}
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    category_id: '',
    sort_order: 0,
    is_active: true,
    image_main: null,
    images: []
  });

  const [categoriesHierarchy, setCategoriesHierarchy] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Charger les catégories avec hiérarchie
  useEffect(() => {
    const loadCategories = async () => {
      console.log('=== DEBUG PRODUCTFORM CATEGORIES ===');
      console.log('categories prop:', categories);
      console.log('categories type:', typeof categories);
      console.log('categories isArray:', Array.isArray(categories));
      console.log('categories length:', categories?.length);
      
      if (Array.isArray(categories) && categories.length > 0) {
        console.log('Utilisation des catégories passées en props');
        setCategoriesHierarchy(categories);
        return;
      }

      try {
        setLoadingCategories(true);
        console.log('Chargement des catégories depuis l\'API...');
        const response = await categoryService.getCategories();
        console.log('Réponse API catégories:', response);
        
        if (response.success) {
          // Extraire les catégories de la structure de réponse API
          let categoriesData = [];
          if (response.data && response.data.categories) {
            // Structure: { categories: [...], total: 1 }
            categoriesData = response.data.categories;
          } else if (Array.isArray(response.data)) {
            // Structure directe: [...]
            categoriesData = response.data;
          }
          
          console.log('Catégories extraites:', categoriesData);
          setCategoriesHierarchy(categoriesData);
        } else {
          console.error('Erreur API catégories:', response);
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

  // Initialiser le formulaire avec les données du produit
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        base_price: product.base_price || '',
        category_id: product.category_id?.toString() || '',
        sort_order: product.sort_order || 0,
        is_active: product.is_active !== undefined ? product.is_active : true,
        image_main: null,
        images: []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        base_price: '',
        category_id: '',
        sort_order: 0,
        is_active: true,
        image_main: null,
        images: []
      });
    }
  }, [product, isOpen]);

  // Fonction pour formater les options de catégories de manière hiérarchique
  const formatCategoryOptions = () => {
    const options = [];
    
    console.log('=== FORMAT CATEGORY OPTIONS ===');
    console.log('categoriesHierarchy:', categoriesHierarchy);
    console.log('categoriesHierarchy type:', typeof categoriesHierarchy);
    console.log('categoriesHierarchy isArray:', Array.isArray(categoriesHierarchy));
    console.log('categoriesHierarchy length:', categoriesHierarchy?.length);
    
    // Vérification de sécurité : s'assurer que categoriesHierarchy est un tableau
    if (!Array.isArray(categoriesHierarchy) || categoriesHierarchy.length === 0) {
      console.log('Aucune catégorie disponible, retour options vides');
      return options;
    }
    
    categoriesHierarchy.forEach(category => {
      console.log('Traitement catégorie:', category);
      // Ajouter la catégorie principale
      options.push({
        value: category.id.toString(),
        label: `📁 ${category.name}`,
        disabled: false // Toujours activé par défaut
      });
      
      // Ajouter les sous-catégories
      if (category.subcategories && category.subcategories.length > 0) {
        category.subcategories.forEach(subcategory => {
          console.log('Traitement sous-catégorie:', subcategory);
          options.push({
            value: subcategory.id.toString(),
            label: `  └─ ${subcategory.name}`,
            disabled: false // Toujours activé par défaut
          });
        });
      }
    });
    
    console.log('Options finales:', options);
    return options;
  };

  // Gestion des changements de formulaire
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Conversion de fichier en base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result;
        console.log('=== DEBUG IMAGE CONVERSION ===');
        console.log('Fichier:', file.name);
        console.log('Type MIME:', file.type);
        console.log('Taille:', file.size);
        console.log('Résultat base64:', result ? result.substring(0, 100) + '...' : 'null');
        console.log('Longueur base64:', result ? result.length : 0);
        
        // Vérifier que le résultat est valide
        if (result && result.startsWith('data:')) {
          // Vérifier que l'URL base64 est complète
          if (result.length > 100) { // Une URL base64 valide doit être assez longue
            console.log('URL base64 valide détectée');
            resolve(result);
          } else {
            console.error('URL base64 trop courte:', result.length);
            reject(new Error('URL base64 trop courte'));
          }
        } else {
          console.error('Format base64 invalide:', result);
          reject(new Error('Format base64 invalide'));
        }
      };
      
      reader.onerror = (error) => {
        console.error('Erreur FileReader:', error);
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  };

  // Gestion de l'upload d'image principale
  const handleMainImageUpload = async (files) => {
    if (files.length === 0) return;
    
    try {
      setUploading(true);
      const file = files[0];
      console.log('=== DEBUG MAIN IMAGE UPLOAD ===');
      console.log('Fichier sélectionné:', file);
      
      // Validation du fichier
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        throw new Error('L\'image est trop volumineuse (max 5MB)');
      }
      
      const base64 = await convertFileToBase64(file);
      console.log('Base64 généré pour image principale:', base64 ? 'SUCCÈS' : 'ÉCHEC');
      
      setFormData(prev => ({ ...prev, image_main: base64 }));
      console.log('État formData mis à jour avec image principale');
    } catch (error) {
      console.error('Erreur conversion base64 image principale:', error);
      alert(`Erreur lors du traitement de l'image principale: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Gestion de l'upload d'images supplémentaires
  const handleImagesUpload = async (files) => {
    if (files.length === 0) return;
    
    try {
      setUploading(true);
      console.log('=== DEBUG ADDITIONAL IMAGES UPLOAD ===');
      console.log('Nombre de fichiers:', files.length);
      
      const newImages = [];
      
      for (const file of files) {
        console.log('Traitement fichier:', file.name);
        
        // Validation du fichier
        if (!file.type.startsWith('image/')) {
          console.error('Fichier ignoré (pas une image):', file.name);
          continue;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB max
          console.error('Fichier ignoré (trop volumineux):', file.name);
          continue;
        }
        
        const base64 = await convertFileToBase64(file);
        console.log('Base64 généré pour', file.name, ':', base64 ? 'SUCCÈS' : 'ÉCHEC');
        
        newImages.push({
          data: base64,
          alt_text: file.name,
          title: file.name,
          sort_order: formData.images.length + newImages.length
        });
      }
      
      console.log('Images traitées:', newImages.length);
      setFormData(prev => ({ 
        ...prev, 
        images: [...prev.images, ...newImages] 
      }));
      console.log('État formData mis à jour avec images supplémentaires');
    } catch (error) {
      console.error('Erreur conversion base64 images supplémentaires:', error);
      alert('Erreur lors du traitement des images supplémentaires');
    } finally {
      setUploading(false);
    }
  };

  // Supprimer une image
  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Supprimer l'image principale
  const removeMainImage = () => {
    setFormData(prev => ({ ...prev, image_main: null }));
  };

  // Gestion du drag & drop
  const handleDrop = (e, type) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    
    if (type === 'main') {
      handleMainImageUpload(files);
    } else {
      handleImagesUpload(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du produit est obligatoire';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La description du produit est obligatoire';
    }
    
    if (!formData.base_price || parseFloat(formData.base_price) < 0) {
      newErrors.base_price = 'Le prix de base doit être un nombre positif';
    }
    
    if (!formData.category_id) {
      newErrors.category_id = 'La catégorie est obligatoire';
    }
    
    return newErrors;
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      // Afficher les erreurs
      return;
    }
    
    // Préparer les données pour l'API
    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      base_price: parseFloat(formData.base_price),
      category_id: parseInt(formData.category_id),
      sort_order: parseInt(formData.sort_order),
      is_active: formData.is_active
    };
    
    // Ajouter l'image principale si elle existe
    if (formData.image_main) {
      submitData.image_main = formData.image_main;
    }
    
    // Ajouter les images supplémentaires si elles existent
    if (formData.images.length > 0) {
      submitData.images = formData.images;
    }
    
    await onSubmit(submitData);
  };

  // Fermer le formulaire
  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      base_price: '',
      category_id: '',
      sort_order: 0,
      is_active: true,
      image_main: null,
      images: []
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={product ? 'Modifier le produit' : 'Créer un nouveau produit'} size="5xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de base */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne gauche - Informations textuelles */}
          <div className="space-y-4">
            {/* Nom du produit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du produit *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Entrez le nom du produit"
                className={errors.name ? 'border-red-500' : ''}
                required
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Décrivez votre produit en détail..."
                rows={4}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-500' : ''
                }`}
                required
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Prix de base */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <CurrencyEuroIcon className="h-4 w-4 mr-2" />
                Prix de base *
              </label>
              <Input
                type="number"
                value={formData.base_price}
                onChange={(e) => handleInputChange('base_price', e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={errors.base_price ? 'border-red-500' : ''}
                required
              />
              {errors.base_price && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errors.base_price}
                </p>
              )}
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <TagIcon className="h-4 w-4 mr-2" />
                Catégorie *
              </label>
              <Select
                value={formData.category_id}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
                className={errors.category_id ? 'border-red-500' : ''}
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
              {errors.category_id && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errors.category_id}
                </p>
              )}
            </div>

            {/* Ordre de tri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <StarIcon className="h-4 w-4 mr-2" />
                Ordre de tri
              </label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => handleInputChange('sort_order', e.target.value)}
                placeholder="0"
                min="0"
                className="w-full"
              />
            </div>

            {/* Statut actif */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Produit actif
              </label>
            </div>
          </div>

          {/* Colonne droite - Gestion des images */}
          <div className="space-y-4">
            {/* Image principale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <PhotoIcon className="h-4 w-4 mr-2" />
                Image principale
              </label>
              
              {formData.image_main ? (
                <div className="relative">
                  {console.log('=== DEBUG AFFICHAGE IMAGE PRINCIPALE ===', formData.image_main)}
                  <img
                    src={formData.image_main}
                    alt="Image principale"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    onLoad={() => console.log('Image principale chargée avec succès')}
                    onError={(e) => console.error('Erreur chargement image principale:', e)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeMainImage}
                    className="absolute top-2 right-2 bg-red-500 text-white hover:bg-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragOver 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={(e) => handleDrop(e, 'main')}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Glissez-déposez une image ici ou{' '}
                    <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleMainImageUpload(Array.from(e.target.files))}
                      />
                      sélectionnez un fichier
                    </label>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Formats : JPG, PNG, GIF, WEBP
                  </p>
                </div>
              )}
            </div>

            {/* Images supplémentaires */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <PhotoIcon className="h-4 w-4 mr-2" />
                Images supplémentaires ({formData.images.length})
              </label>
              
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  dragOver 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={(e) => handleDrop(e, 'additional')}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <PlusIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Glissez-déposez des images ici ou{' '}
                  <label className="text-green-600 hover:text-green-500 cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImagesUpload(Array.from(e.target.files))}
                    />
                    sélectionnez des fichiers
                  </label>
                </p>
              </div>

              {/* Aperçu des images supplémentaires */}
              {formData.images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      {console.log(`=== DEBUG AFFICHAGE IMAGE ${index} ===`, image.data)}
                      <img
                        src={image.data}
                        alt={image.alt_text}
                        className="w-full h-20 object-cover rounded border border-gray-200"
                        onLoad={() => console.log(`Image ${index} chargée avec succès`)}
                        onError={(e) => console.error(`Erreur chargement image ${index}:`, e)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white hover:bg-red-600 p-1"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Indicateur d'upload */}
            {uploading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Traitement des images...</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions du formulaire */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
            <span>{product ? 'Mettre à jour' : 'Créer le produit'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductForm;
