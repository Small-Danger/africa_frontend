import React, { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useNotification } from '../../hooks/useNotification';

const ProductVariantForm = ({
  isOpen,
  onClose,
  onSubmit,
  variant = null,
  loading = false,
  errors = {}
}) => {
  const isEditing = !!variant;
  const title = isEditing ? 'Modifier la variante' : 'Nouvelle variante';
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock_quantity: '',
    is_active: true,
    sort_order: 0
  });

  const { error: showError } = useNotification();

  // Initialiser les données du formulaire
  useEffect(() => {
    if (variant) {
      setFormData({
        name: variant.name || '',
        price: variant.price || '',
        stock_quantity: variant.stock_quantity || '',
        is_active: variant.is_active !== undefined ? variant.is_active : true,
        sort_order: variant.sort_order || 0
      });
    } else {
      // Réinitialiser pour une nouvelle variante
      setFormData({
        name: '',
        price: '',
        stock_quantity: '',
        is_active: true,
        sort_order: 0
      });
    }
  }, [variant, isOpen]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      showError('Le nom de la variante est requis');
      return;
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      showError('Le prix doit être un nombre positif');
      return;
    }

    if (formData.stock_quantity && parseInt(formData.stock_quantity) < 0) {
      showError('La quantité en stock doit être positive');
      return;
    }

    try {
      const formattedData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order) || 0
      };

      await onSubmit(formattedData);
      onClose();
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      price: '',
      stock_quantity: '',
      is_active: true,
      sort_order: 0
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="2xl"
    >
      <div className="space-y-6">
        {/* Informations de base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la variante <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Rouge, XL, Premium, etc."
              className="w-full"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix (FCFA) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full"
              required
            />
          </div>
        </div>

        {/* Stock et SKU */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantité en stock
            </label>
            <Input
              type="number"
              value={formData.stock_quantity}
              onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
              placeholder="0"
              min="0"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code SKU
            </label>
            <Input
              type="text"
              value={formData.sku}
              onChange={(e) => handleInputChange('sku', e.target.value)}
              placeholder="SKU-001"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poids (kg)
            </label>
            <Input
              type="number"
              value={formData.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              placeholder="0.0"
              step="0.1"
              min="0"
              className="w-full"
            />
          </div>
        </div>

        {/* Dimensions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Dimensions (cm)
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Input
                type="number"
                value={formData.dimensions.length}
                onChange={(e) => handleInputChange('dimensions.length', e.target.value)}
                placeholder="Longueur"
                step="0.1"
                min="0"
                className="w-full"
              />
            </div>
            <div>
              <Input
                type="number"
                value={formData.dimensions.width}
                onChange={(e) => handleInputChange('dimensions.width', e.target.value)}
                placeholder="Largeur"
                step="0.1"
                min="0"
                className="w-full"
              />
            </div>
            <div>
              <Input
                type="number"
                value={formData.dimensions.height}
                onChange={(e) => handleInputChange('dimensions.height', e.target.value)}
                placeholder="Hauteur"
                step="0.1"
                min="0"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Attributs personnalisés */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Attributs personnalisés
            </label>
            <TagIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          {/* Ajout d'attribut */}
          <div className="flex space-x-2">
            <Input
              type="text"
              value={attributeKey}
              onChange={(e) => setAttributeKey(e.target.value)}
              placeholder="Clé (ex: Couleur)"
              className="flex-1"
            />
            <Input
              type="text"
              value={attributeValue}
              onChange={(e) => setAttributeValue(e.target.value)}
              placeholder="Valeur (ex: Rouge)"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addAttribute}
              className="px-4"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Liste des attributs */}
          {Object.keys(formData.attributes).length > 0 && (
            <div className="space-y-2">
              {Object.entries(formData.attributes).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">{key}:</span>
                    <span className="text-sm text-gray-600">{value}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttribute(key)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Options avancées */}
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Variante active
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
          >
            {isEditing ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProductVariantForm;
