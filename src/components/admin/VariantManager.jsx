import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon, CubeIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { variantService } from '../../services/api';

const VariantManager = ({ product, onClose, onUpdate }) => {
  const mountedRef = useRef(true);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [batchMode, setBatchMode] = useState(false);
  const [batchVariants, setBatchVariants] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    sku: '',
    stock_quantity: '',
    is_active: true,
    sort_order: 0
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (product) {
      loadVariants();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [product]);

  const loadVariants = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des variantes pour le produit:', product.id);
      
      const response = await variantService.getProductVariants(product.id);
      console.log('📡 Réponse API variantes complète:', response);
      
      if (response.success) {
        const variantsData = response.data?.variants || response.data || [];
        console.log('📦 Variantes extraites:', variantsData);
        console.log('📊 Structure de la réponse:', {
          has_data: !!response.data,
          has_variants: !!response.data?.variants,
          data_type: typeof response.data,
          variants_type: typeof variantsData,
          is_array: Array.isArray(variantsData),
          length: Array.isArray(variantsData) ? variantsData.length : 'N/A'
        });
        
        const finalVariants = Array.isArray(variantsData) ? variantsData : [];
        console.log('🎯 Variantes finales à définir:', finalVariants);
        
        // Vérifier que le composant est encore monté avant de mettre à jour l'état
        if (mountedRef.current) {
          setVariants(finalVariants);
        }
      } else {
        console.warn('⚠️ Réponse API non réussie:', response);
        if (mountedRef.current) {
          setVariants([]);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des variantes:', error);
      if (mountedRef.current) {
        setVariants([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setActionLoading(true);
    
    try {
      // Validation côté frontend
      const validationErrors = {};
      
      if (!formData.name.trim()) {
        validationErrors.name = ['Le nom de la variante est obligatoire'];
      }
      
      if (!formData.price || parseFloat(formData.price) <= 0) {
        validationErrors.price = ['Le prix doit être supérieur à 0'];
      }
      
      // S'assurer que le SKU est une chaîne valide
      if (formData.sku && typeof formData.sku !== 'string') {
        validationErrors.sku = ['Le SKU doit être une chaîne de caractères'];
      }
      
      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        setActionLoading(false);
        return;
      }
      
      // Préparer les données pour l'API
      const apiData = {
        ...formData,
        sku: formData.sku || '', // Envoyer chaîne vide si vide
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null, // Envoyer null si vide
        is_active: Boolean(formData.is_active),
        sort_order: parseInt(formData.sort_order) || 0
      };
      
      // Déboguer les données envoyées
      console.log('🔍 Données envoyées à l\'API:', {
        original: formData,
        processed: apiData,
        sku_type: typeof apiData.sku,
        sku_value: apiData.sku
      });
      
      console.log('💾 Sauvegarde variante:', apiData);
      
      let response;
      if (editingVariant) {
        console.log('✏️ Mise à jour variante existante:', editingVariant.id);
        response = await variantService.updateVariant(product.id, editingVariant.id, apiData);
      } else {
        console.log('➕ Création nouvelle variante');
        response = await variantService.createVariant(product.id, apiData);
      }
      
      console.log('✅ Réponse sauvegarde:', response);
      
      if (response.success) {
        console.log('✅ Variante sauvegardée avec succès');
        resetForm();
        setShowForm(false);
        await loadVariants();
        if (onUpdate) onUpdate();
      } else {
        console.error('❌ Échec de la sauvegarde:', response);
        if (response.errors) {
          setFormErrors(response.errors);
        } else {
          setFormErrors({ general: [response.message || 'Une erreur est survenue'] });
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        setFormErrors({ 
          general: [error.message || 'Une erreur est survenue lors de la sauvegarde'] 
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      sku: '',
      stock_quantity: '',
      is_active: true,
      sort_order: 0
    });
    setFormErrors({});
    setEditingVariant(null);
    setShowForm(false);
  };

  // Fonctions pour le mode batch
  const addBatchVariant = () => {
    setBatchVariants(prev => [...prev, {
      name: '',
      price: '',
      sku: '',
      stock_quantity: '',
      is_active: true,
      sort_order: prev.length
    }]);
  };

  const removeBatchVariant = (index) => {
    setBatchVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateBatchVariant = (index, field, value) => {
    setBatchVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setActionLoading(true);
    
    try {
      // Validation des données batch
      const validationErrors = {};
      const validVariants = [];
      
      batchVariants.forEach((variant, index) => {
        const variantErrors = {};
        
        if (!variant.name.trim()) {
          variantErrors.name = 'Le nom est obligatoire';
        }
        
        if (!variant.price || parseFloat(variant.price) <= 0) {
          variantErrors.price = 'Le prix doit être supérieur à 0';
        }
        
        if (Object.keys(variantErrors).length > 0) {
          validationErrors[`variants.${index}`] = variantErrors;
        } else {
          validVariants.push({
            name: variant.name.trim(),
            price: parseFloat(variant.price),
            sku: variant.sku || null,
            stock_quantity: variant.stock_quantity ? parseInt(variant.stock_quantity) : null,
            is_active: Boolean(variant.is_active),
            sort_order: parseInt(variant.sort_order) || 0
          });
        }
      });
      
      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        setActionLoading(false);
        return;
      }
      
      if (validVariants.length === 0) {
        setFormErrors({ general: ['Aucune variante valide à créer'] });
        setActionLoading(false);
        return;
      }
      
      console.log('💾 Création batch de variantes:', validVariants);
      
      const response = await variantService.createVariantsBatch(product.id, validVariants);
      console.log('✅ Réponse création batch:', response);
      
      if (response.success) {
        console.log('✅ Variantes créées avec succès');
        await loadVariants();
        if (onUpdate) onUpdate();
        setBatchVariants([]);
        setBatchMode(false);
      } else {
        console.error('❌ Échec de la création batch:', response);
        if (response.errors) {
          setFormErrors(response.errors);
        } else {
          setFormErrors({ general: [response.message || 'Une erreur est survenue'] });
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création batch:', error);
      setFormErrors({ 
        general: [error.message || 'Une erreur est survenue lors de la création'] 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const editVariant = (variant) => {
    console.log('✏️ Édition variante:', variant);
    setEditingVariant(variant);
    setFormData({
      name: variant.name || '',
      price: variant.price || '',
      sku: variant.sku || '',
      stock_quantity: variant.stock_quantity !== null ? variant.stock_quantity : '',
      is_active: variant.is_active !== undefined ? variant.is_active : true,
      sort_order: variant.sort_order || 0
    });
    setFormErrors({});
    setShowForm(true);
  };

  const deleteVariant = async (variantId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette variante ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      setActionLoading(true);
      console.log('🗑️ Suppression variante:', variantId);
      
      const response = await variantService.deleteVariant(product.id, variantId);
      console.log('✅ Réponse suppression:', response);
      
      if (response.success) {
        console.log('✅ Variante supprimée avec succès');
        await loadVariants();
        if (onUpdate) onUpdate();
      } else {
        console.error('❌ Échec de la suppression:', response);
        alert(response.message || 'Erreur lors de la suppression de la variante');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert(error.message || 'Erreur lors de la suppression de la variante');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleVariantStatus = async (variant) => {
    try {
      setActionLoading(true);
      const newStatus = !variant.is_active;
      console.log('🔄 Changement statut variante:', variant.id, 'de', variant.is_active, 'à', newStatus);
      
      const response = await variantService.updateVariant(product.id, variant.id, {
        is_active: newStatus
      });
      
      console.log('✅ Réponse changement statut:', response);
      
      if (response.success) {
        await loadVariants();
        onUpdate();
      } else {
        console.error('❌ Échec du changement de statut:', response);
        alert('Erreur lors du changement de statut');
      }
    } catch (error) {
      console.error('❌ Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut');
    } finally {
      setActionLoading(false);
    }
  };

  const getStockStatus = (variant) => {
    const state = variant?.stock_status;
    if (state === 'sur_commande') {
      return { label: variant.stock_label || 'Sur commande', variant: 'warning' };
    }
    if (state === 'rupture') {
      return { label: variant.stock_label || 'Rupture', variant: 'danger' };
    }
    if (variant?.needs_inventory) {
      return { label: variant.stock_label || 'À inventorier', variant: 'info' };
    }
    if (variant?.stock_label) {
      return { label: variant.stock_label, variant: 'success' };
    }
    if (variant?.stock_quantity === 0) {
      return { label: 'Rupture', variant: 'danger' };
    }
    if (typeof variant?.stock_quantity === 'number' && variant.stock_quantity <= 5) {
      return { label: 'Faible', variant: 'warning' };
    }
    return { label: 'En stock', variant: 'success' };
  };

  const handleInputChange = (field, value) => {
    // S'assurer que le SKU est toujours une chaîne
    let processedValue = value;
    if (field === 'sku') {
      processedValue = String(value || '');
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Effacer l'erreur du champ modifié
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Gestion des variantes" size="5xl">
      <div className="space-y-6">
        {/* En-tête avec informations du produit */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Variantes du produit: {product.name}
          </h3>
          <p className="text-sm text-gray-600">
            Gérez les différentes versions, tailles ou options de ce produit
          </p>
        </div>

        {/* En-tête avec bouton d'ajout */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{variants.length}</span> variante{variants.length !== 1 ? 's' : ''} configurée{variants.length !== 1 ? 's' : ''}
            </div>
            {variants.length > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">
                  {variants.filter(v => v.is_active).length}
                </span> active{variants.filter(v => v.is_active).length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setShowForm(true)} 
              size="sm"
              disabled={actionLoading}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Ajouter une variante
            </Button>
            <Button 
              onClick={() => setBatchMode(true)} 
              size="sm"
              variant="outline"
              disabled={actionLoading}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Créer plusieurs variantes
            </Button>
          </div>
        </div>

        {/* Liste des variantes */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Chargement des variantes...</p>
          </div>
        ) : variants.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
            <CubeIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Aucune variante configurée</p>
            <p className="text-sm text-gray-600 mb-4">
              Ce produit n'a pas encore de variantes. Ajoutez des tailles, couleurs, ou autres options.
            </p>
            <Button 
              onClick={() => setShowForm(true)} 
              size="sm"
              disabled={actionLoading}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Créer la première variante
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {variants.map((variant) => {
              const stockStatus = getStockStatus(variant);
              return (
                <div
                  key={variant.id}
                  className={`p-6 border rounded-lg transition-all duration-200 hover:shadow-md ${
                    variant.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* En-tête de la variante */}
                      <div className="flex items-center space-x-4 mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">{variant.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant={variant.is_active ? "success" : "secondary"}>
                            {variant.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.label}
                          </Badge>
                          {variant.sku && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {variant.sku}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Détails de la variante */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Prix:</span>
                          <div className="text-lg font-bold text-green-600">
                            {Math.round(parseFloat(variant.price || 0))} FCFA
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Stock:</span>
                          <div className="text-gray-900">
                            {variant.needs_inventory
                              ? 'À inventorier'
                              : variant.stock_quantity == null
                                ? '—'
                                : variant.stock_quantity}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">SKU:</span>
                          <div className="text-gray-900 font-mono">
                            {variant.sku || 'Non défini'}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Ordre:</span>
                          <div className="text-gray-900">{variant.sort_order || 0}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editVariant(variant)}
                        className="text-blue-600 hover:text-blue-700"
                        title="Modifier la variante"
                        disabled={actionLoading}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVariantStatus(variant)}
                        className={`${
                          variant.is_active 
                            ? 'text-yellow-600 hover:text-yellow-700' 
                            : 'text-green-600 hover:text-green-700'
                        }`}
                        title={variant.is_active ? 'Désactiver' : 'Activer'}
                        disabled={actionLoading}
                      >
                        {variant.is_active ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteVariant(variant.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Supprimer la variante"
                        disabled={actionLoading}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Formulaire pour ajouter/modifier une variante */}
        {showForm && (
          <Modal
            isOpen={showForm}
            onClose={() => setShowForm(false)}
            title={editingVariant ? 'Modifier la variante' : 'Ajouter une variante'}
            size="2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Erreur générale */}
              {formErrors.general && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{formErrors.general[0]}</p>
                </div>
              )}

              {/* Nom et Prix - Champs obligatoires */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la variante <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ex: 500g, Rouge, Grande taille..."
                    required
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name[0]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">FCFA</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.price ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  {formErrors.price && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.price[0]}</p>
                  )}
                </div>
              </div>
              
              {/* SKU et Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.sku ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ex: POM-500G, TOM-1KG..."
                  />
                  {formErrors.sku && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.sku[0]}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Code unique pour identifier cette variante
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité en stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.stock_quantity ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Vide = à inventorier"
                  />
                  {formErrors.stock_quantity && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.stock_quantity[0]}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Laissez vide tant que le stock n&apos;a pas été compté. 0 = rupture (ou sur commande si autorisé).
                  </p>
                </div>
              </div>

              {/* Ordre de tri et Statut */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordre de tri
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.sort_order ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                  {formErrors.sort_order && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.sort_order[0]}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Plus le nombre est petit, plus la variante apparaît en premier
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut de la variante
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="is_active"
                        value="true"
                        checked={formData.is_active === true}
                        onChange={() => handleInputChange('is_active', true)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-900">Active</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="is_active"
                        value="false"
                        checked={formData.is_active === false}
                        onChange={() => handleInputChange('is_active', false)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-900">Inactive</span>
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Une variante inactive ne sera pas visible aux clients
                  </p>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={actionLoading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!formData.name || !formData.price || actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingVariant ? 'Mise à jour...' : 'Ajout...'}
                    </>
                  ) : (
                    editingVariant ? 'Mettre à jour' : 'Ajouter'
                  )}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Formulaire de création en batch */}
        {batchMode && (
          <Modal isOpen={true} onClose={() => setBatchMode(false)} title="Créer plusieurs variantes" size="6xl">
            <form onSubmit={handleBatchSubmit} className="space-y-6">
              {/* En-tête avec bouton d'ajout */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Création en lot de variantes
                  </h3>
                  <p className="text-sm text-gray-600">
                    Créez plusieurs variantes en une seule fois
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addBatchVariant}
                  size="sm"
                  disabled={actionLoading}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Ajouter une ligne
                </Button>
              </div>

              {/* Tableau des variantes */}
              {batchVariants.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
                    <div className="col-span-3">Nom</div>
                    <div className="col-span-2">Prix</div>
                    <div className="col-span-2">SKU</div>
                    <div className="col-span-2">Stock</div>
                    <div className="col-span-2">Statut</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                  
                  {batchVariants.map((variant, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-start">
                      {/* Nom */}
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => updateBatchVariant(index, 'name', e.target.value)}
                          placeholder="Nom de la variante"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {formErrors[`variants.${index}`]?.name && (
                          <p className="text-red-500 text-xs mt-1">
                            {formErrors[`variants.${index}`].name}
                          </p>
                        )}
                      </div>
                      
                      {/* Prix */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          value={variant.price}
                          onChange={(e) => updateBatchVariant(index, 'price', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {formErrors[`variants.${index}`]?.price && (
                          <p className="text-red-500 text-xs mt-1">
                            {formErrors[`variants.${index}`].price}
                          </p>
                        )}
                      </div>
                      
                      {/* SKU */}
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => updateBatchVariant(index, 'sku', e.target.value)}
                          placeholder="SKU (optionnel)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      {/* Stock */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={variant.stock_quantity}
                          onChange={(e) => updateBatchVariant(index, 'stock_quantity', e.target.value)}
                          placeholder="Stock"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      {/* Statut */}
                      <div className="col-span-2">
                        <select
                          value={variant.is_active}
                          onChange={(e) => updateBatchVariant(index, 'is_active', e.target.value === 'true')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={true}>Actif</option>
                          <option value={false}>Inactif</option>
                        </select>
                      </div>
                      
                      {/* Actions */}
                      <div className="col-span-1">
                        <Button
                          type="button"
                          onClick={() => removeBatchVariant(index)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CubeIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>Aucune variante à créer</p>
                  <p className="text-sm">Cliquez sur "Ajouter une ligne" pour commencer</p>
                </div>
              )}

              {/* Erreurs générales */}
              {formErrors.general && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800 text-sm">{formErrors.general[0]}</p>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setBatchMode(false);
                    setBatchVariants([]);
                  }}
                  disabled={actionLoading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={batchVariants.length === 0 || actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Création...
                    </>
                  ) : (
                    `Créer ${batchVariants.length} variante(s)`
                  )}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </Modal>
  );
};

export default VariantManager;
