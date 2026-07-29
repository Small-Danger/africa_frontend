import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  PhotoIcon, 
  CubeIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import NotificationContainer from '../../components/ui/NotificationContainer';
import { useNotification } from '../../hooks/useNotification';
import ProductForm from '../../components/forms/ProductForm';
import BatchProductForm from '../../components/forms/BatchProductForm';
import ImageManager from '../../components/admin/ImageManager';
import VariantManager from '../../components/admin/VariantManager';
import { productService, categoryService } from '../../services/api';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminLoadingScreen,
  AdminButton,
} from '../../components/admin/adminShared';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  // États pour les filtres et l'affichage
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' ou 'grid'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'created_at', 'price'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' ou 'desc'
  const [showFilters, setShowFilters] = useState(false);
  
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
    from: 1,
    to: 10
  });

  const { notifications, addNotification, removeNotification } = useNotification();

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des données...', { forceRefresh });
      
      // Charger les produits avec filtres
      const productsParams = {
        page: pagination.current_page,
        per_page: pagination.per_page,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
        sort_by: sortBy || undefined,
        sort_order: sortOrder || undefined
      };
      
      // Nettoyer les paramètres undefined
      Object.keys(productsParams).forEach(key => 
        productsParams[key] === undefined && delete productsParams[key]
      );
      
      console.log('📦 Paramètres produits:', productsParams);
      const productsResponse = await productService.getProductsAdmin(productsParams);
      console.log('📦 Réponse API produits:', productsResponse);
      
      if (productsResponse.success) {
        console.log('📦 Réponse API complète:', productsResponse);
        
        // Structure de réponse admin (data directe)
        const productsData = productsResponse.data || [];
        console.log('📦 Produits extraits:', productsData);
        
        setProducts(Array.isArray(productsData) ? productsData : []);
        
        // Gestion de la pagination (structure admin)
        setPagination({
          current_page: productsResponse.current_page || 1,
          per_page: productsResponse.per_page || 10,
          total: productsResponse.total || 0,
          last_page: productsResponse.last_page || 1,
          from: productsResponse.from || 1,
          to: productsResponse.to || productsData.length
        });
      } else {
        console.error('❌ Erreur API produits:', productsResponse.message);
        addNotification('error', productsResponse.message || 'Erreur lors du chargement des produits');
      }
      
      // Charger les catégories seulement si nécessaire
      if (categories.length === 0 || forceRefresh) {
        const categoriesResponse = await categoryService.getCategories();
        console.log('📂 Réponse API catégories:', categoriesResponse);
        
        if (categoriesResponse.success) {
          const categoriesData = categoriesResponse.data?.categories || categoriesResponse.data || [];
          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        } else {
          console.error('❌ Erreur API catégories:', categoriesResponse.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      addNotification('error', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [pagination.current_page, pagination.per_page, searchTerm, statusFilter, categoryFilter, sortBy, sortOrder, categories.length, addNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProductSubmit = async (productData) => {
    try {
      setActionLoading(true);
      setFormErrors({});
      
      console.log('💾 Sauvegarde produit:', { editingProduct: !!editingProduct, productData });
      
      let response;
      if (editingProduct) {
        response = await productService.updateProduct(editingProduct.id, productData);
      } else {
        response = await productService.createProduct(productData);
      }
      
      console.log('✅ Réponse sauvegarde:', response);
      
      if (response.success) {
        addNotification(
          'success', 
          editingProduct ? 'Produit mis à jour avec succès' : 'Produit créé avec succès'
        );
        setShowProductModal(false);
        setEditingProduct(null);
        await fetchData(true); // Force refresh
      } else {
        if (response.errors) {
          setFormErrors(response.errors);
        } else {
          addNotification('error', response.message || 'Une erreur est survenue');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du produit:', error);
      addNotification('error', 'Erreur lors de la sauvegarde du produit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchSubmit = async (batchData) => {
    try {
      setActionLoading(true);
      setFormErrors({});
      
      console.log('💾 Sauvegarde en masse:', batchData);
      
      const response = await productService.createProductsBatch(batchData);
      
      console.log('✅ Réponse sauvegarde en masse:', response);
      
      if (response.success) {
        addNotification(
          'success', 
          `${response.data.count} produit(s) créé(s) avec succès`
        );
        setShowBatchModal(false);
        await fetchData(true); // Force refresh
      } else {
        if (response.errors) {
          setFormErrors(response.errors);
        } else {
          addNotification('error', response.message || 'Une erreur est survenue');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde en masse:', error);
      addNotification('error', 'Erreur lors de la création en masse des produits');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    
    try {
      setActionLoading(true);
      console.log('🗑️ Suppression produit:', selectedProduct.id);
      
      const response = await productService.deleteProduct(selectedProduct.id);
      console.log('✅ Réponse suppression:', response);
      
      if (response.success) {
        addNotification('success', 'Produit supprimé avec succès');
        setShowDeleteConfirm(false);
        setSelectedProduct(null);
        await fetchData(true); // Force refresh
      } else {
        addNotification('error', response.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      addNotification('error', 'Erreur lors de la suppression du produit');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = (product) => {
    setSelectedProduct(product);
    setShowDeleteConfirm(true);
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const openImagesModal = (product) => {
    setSelectedProduct(product);
    setShowImagesModal(true);
  };

  const openVariantsModal = (product) => {
    setSelectedProduct(product);
    setShowVariantsModal(true);
  };

  // Fonction pour gérer la fermeture des modales avec refresh
  const handleModalClose = async (modalType) => {
    switch (modalType) {
      case 'images':
        setShowImagesModal(false);
        setSelectedProduct(null);
        await fetchData(true);
        break;
      case 'variants':
        setShowVariantsModal(false);
        setSelectedProduct(null);
        await fetchData(true);
        break;
      case 'product':
        setShowProductModal(false);
        setEditingProduct(null);
        setFormErrors({});
        break;
      default:
        break;
    }
  };

  // Fonction pour gérer les mises à jour depuis les modales
  const handleModalUpdate = async () => {
    await fetchData(true);
  };

  // Fonction pour obtenir le nom de la catégorie
  const getCategoryName = (product) => {
    console.log('🔍 === DÉBOGAGE CATÉGORIE ===');
    console.log('📦 Produit reçu:', product);
    console.log('📂 Catégories disponibles:', categories);
    
    // Vérifier différentes structures possibles pour la catégorie
    let categoryId = null;
    let categoryObject = null;
    
    // Structure 1: product.category.id
    if (product.category && product.category.id) {
      categoryId = product.category.id;
      categoryObject = product.category;
      console.log('✅ Structure 1 détectée: product.category.id =', categoryId);
    }
    // Structure 2: product.category_id
    else if (product.category_id) {
      categoryId = product.category_id;
      console.log('✅ Structure 2 détectée: product.category_id =', categoryId);
    }
    // Structure 3: product.category (directement un objet)
    else if (product.category && typeof product.category === 'object') {
      categoryObject = product.category;
      categoryId = product.category.id;
      console.log('✅ Structure 3 détectée: product.category (objet) =', categoryObject);
    }
    // Structure 4: product.category (directement un ID)
    else if (product.category && typeof product.category === 'number') {
      categoryId = product.category;
      console.log('✅ Structure 4 détectée: product.category (nombre) =', categoryId);
    }
    
    console.log('🎯 ID de catégorie final:', categoryId);
    console.log('🎯 Objet catégorie final:', categoryObject);
    
    // Si on a déjà l'objet catégorie complet, l'utiliser directement
    if (categoryObject && categoryObject.name) {
      console.log('✅ Utilisation de l\'objet catégorie existant:', categoryObject.name);
      return formatCategoryDisplay(categoryObject);
    }
    
    // Sinon, chercher dans la liste des catégories
    if (categoryId && Array.isArray(categories)) {
      const category = categories.find(cat => cat.id === categoryId);
      console.log('🎯 Catégorie trouvée dans la liste:', category);
      
      if (category) {
        return formatCategoryDisplay(category);
      }
    }
    
    console.log('❌ Aucune catégorie trouvée');
    return 'Catégorie inconnue';
  };

  // Fonction pour formater l'affichage des catégories (gestion hiérarchique)
  const formatCategoryDisplay = (category) => {
    if (!category) return 'Catégorie inconnue';
    
    if (category.parent_id && category.parent) {
      return `${category.parent.name} > ${category.name}`;
    }
    
    return category.name;
  };

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (isActive) => {
    console.log('🏷️ Génération badge pour isActive:', isActive, 'Type:', typeof isActive);
    
    // Par défaut, considérer le produit comme actif si isActive est undefined
    const isProductActive = isActive !== undefined ? isActive : true;
    console.log('🏷️ Statut final du produit:', isProductActive);
    
    return (
      <Badge variant={isProductActive ? "success" : "secondary"}>
        {isProductActive ? 'Actif' : 'Inactif'}
      </Badge>
    );
  };

  // Les produits sont déjà filtrés côté serveur, pas besoin de filtrage local
  const filteredAndSortedProducts = products;

  if (loading) {
    return <AdminLoadingScreen label="Chargement des produits…" />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Gérez votre catalogue de produits AfrikRaga"
        action={
          <>
            <AdminButton variant="outline" icon={ArrowPathIcon} loading={loading} onClick={() => fetchData(true)}>
              Actualiser
            </AdminButton>
            <AdminButton variant="outline" icon={PlusIcon} onClick={() => setShowBatchModal(true)}>
              <span className="hidden sm:inline">Créer plusieurs produits</span>
              <span className="sm:hidden">En masse</span>
            </AdminButton>
            <AdminButton variant="primary" icon={PlusIcon} onClick={() => setShowProductModal(true)}>
              <span className="hidden sm:inline">Nouveau produit</span>
              <span className="sm:hidden">Nouveau</span>
            </AdminButton>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Total produits" value={String(pagination.total)} icon={CubeIcon} accent="green" />
        <AdminStatCard
          label="Produits actifs"
          value={String(products.filter((p) => p.is_active !== false).length)}
          icon={PhotoIcon}
          accent="emerald"
        />
        <AdminStatCard
          label="Produits inactifs"
          value={String(products.filter((p) => p.is_active === false).length)}
          icon={EyeSlashIcon}
          accent="orange"
        />
        <AdminStatCard label="Catégories" value={String(categories.length)} icon={CubeIcon} accent="violet" />
      </div>

        {/* Barre de recherche et filtres */}
        <Card className="shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              {/* Ligne principale */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Recherche */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un produit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                    />
                  </div>
                </div>

                {/* Contrôles d'affichage et filtres */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Bouton de filtres */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 ${showFilters ? 'bg-brand-green-light text-brand-green' : ''}`}
                  >
                    <FunnelIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Filtres</span>
                  </Button>


                  {/* Sélecteur de vue */}
                  <div className="flex items-center border border-gray-200 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'table' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="p-2"
                    >
                      <ListBulletIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="p-2"
                    >
                      <Squares2X2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Panneau de filtres avancés - Mobile first */}
              {showFilters && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-4">
                    {/* Filtres en colonnes sur mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Filtre par statut */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Statut</label>
                        <div className="flex items-center border border-gray-200 rounded-lg p-1">
                          <button
                            onClick={() => setStatusFilter('all')}
                            className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                              statusFilter === 'all' 
                                ? 'bg-blue-100 text-blue-700 font-medium' 
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Tous
                          </button>
                          <button
                            onClick={() => setStatusFilter('active')}
                            className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                              statusFilter === 'active' 
                                ? 'bg-green-100 text-green-700 font-medium' 
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Actifs
                          </button>
                          <button
                            onClick={() => setStatusFilter('inactive')}
                            className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                              statusFilter === 'inactive' 
                                ? 'bg-red-100 text-red-700 font-medium' 
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Inactifs
                          </button>
                        </div>
                      </div>

                      {/* Filtre par catégorie */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Catégorie</label>
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">Toutes les catégories</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filtre par tri */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Trier par</label>
                        <select
                          value={`${sortBy}-${sortOrder}`}
                          onChange={(e) => {
                            const [newSortBy, newSortOrder] = e.target.value.split('-');
                            setSortBy(newSortBy);
                            setSortOrder(newSortOrder);
                          }}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="name-asc">Nom (A-Z)</option>
                          <option value="name-desc">Nom (Z-A)</option>
                          <option value="created_at-desc">Plus récent</option>
                          <option value="created_at-asc">Plus ancien</option>
                          <option value="price-asc">Prix croissant</option>
                          <option value="price-desc">Prix décroissant</option>
                        </select>
                      </div>
                    </div>

                    {/* Actions des filtres */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        {filteredAndSortedProducts.length} produit{filteredAndSortedProducts.length > 1 ? 's' : ''} trouvé{filteredAndSortedProducts.length > 1 ? 's' : ''}
                      </div>
                      
                      {/* Bouton pour effacer les filtres */}
                      {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                            setCategoryFilter('all');
                            setSortBy('name');
                            setSortOrder('asc');
                          }}
                          className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
                        >
                          <XMarkIcon className="h-4 w-4" />
                          Effacer tous les filtres
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Liste des produits */}
        <Card className="shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Produits
              </CardTitle>
              <div className="text-sm text-gray-500">
                {filteredAndSortedProducts.length} produit{filteredAndSortedProducts.length > 1 ? 's' : ''}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <CubeIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' ? 'Aucun produit trouvé' : 'Aucun produit'}
                </h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'Essayez de modifier vos critères de recherche ou de filtres' 
                    : 'Commencez par créer votre premier produit pour votre catalogue'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && (
                  <Button variant="primary" onClick={() => setShowProductModal(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Créer mon premier produit
                  </Button>
                )}
              </div>
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Catégorie
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prix
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedProducts.map((product) => (
                      <tr key={product.id} className="group hover:bg-gray-50/50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-12 w-12 flex-shrink-0">
                              {product.image_main && product.image_main !== null ? (
                                <img
                                  className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                                  src={product.image_main}
                                  alt={product.name}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200">
                                  <PhotoIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getCategoryName(product)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(() => {
                            // Vérifier différentes propriétés possibles pour le prix
                            let displayPrice = '0';
                            
                            if (product.price !== undefined && product.price !== null) {
                              displayPrice = Math.round(parseFloat(product.price)).toString();
                            } else if (product.base_price !== undefined && product.base_price !== null) {
                              displayPrice = Math.round(parseFloat(product.base_price)).toString();
                            } else if (product.regular_price !== undefined && product.regular_price !== null) {
                              displayPrice = Math.round(parseFloat(product.regular_price)).toString();
                            } else if (product.sale_price !== undefined && product.sale_price !== null) {
                              displayPrice = Math.round(parseFloat(product.sale_price)).toString();
                            }
                            
                            return `${Math.round(parseFloat(displayPrice))} FCFA`;
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(product.is_active)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editProduct(product)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
                              title="Modifier le produit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openImagesModal(product)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
                              title="Gérer les images"
                            >
                              <PhotoIcon className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openVariantsModal(product)}
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
                              title="Gérer les variantes"
                            >
                              <CubeIcon className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDelete(product)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
                              title="Supprimer le produit"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // Vue grille - Mobile first
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 p-4 sm:p-6">
                {filteredAndSortedProducts.map((product) => (
                  <div key={product.id} className="group bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200 overflow-hidden">
                    {/* Image du produit */}
                    <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                      {product.image_main && product.image_main !== null ? (
                        <div className="w-full max-w-md mx-auto h-full flex items-center justify-center">
                          <img
                            className="w-full h-full object-cover object-center"
                            src={product.image_main}
                            alt={product.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        </div>
                      ) : null}
                      
                      {/* Fallback si pas d'image */}
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <PhotoIcon className="h-16 w-16 text-gray-400" />
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {/* Header avec nom et statut */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1 mr-2">
                          {product.name}
                        </h3>
                        <div className="flex-shrink-0">
                          {getStatusBadge(product.is_active)}
                        </div>
                      </div>
                      
                      {/* Catégorie */}
                      <p className="text-xs text-gray-500 mb-3 line-clamp-1">{getCategoryName(product)}</p>
                      
                      {/* Prix */}
                      <div className="mb-4">
                        <span className="text-lg font-bold text-blue-600">
                          {(() => {
                            let displayPrice = '0';
                            if (product.price !== undefined && product.price !== null) {
                              displayPrice = Math.round(parseFloat(product.price)).toString();
                            } else if (product.base_price !== undefined && product.base_price !== null) {
                              displayPrice = Math.round(parseFloat(product.base_price)).toString();
                            }
                            return `${Math.round(parseFloat(displayPrice))} FCFA`;
                          })()}
                        </span>
                      </div>
                      
                      {/* Actions - Layout mobile optimisé */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editProduct(product)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center justify-center gap-1"
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span className="text-xs">Modifier</span>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openImagesModal(product)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 flex items-center justify-center gap-1"
                        >
                          <PhotoIcon className="h-4 w-4" />
                          <span className="text-xs">Images</span>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openVariantsModal(product)}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 flex items-center justify-center gap-1"
                        >
                          <CubeIcon className="h-4 w-4" />
                          <span className="text-xs">Variantes</span>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(product)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-center gap-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span className="text-xs">Supprimer</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-700">
                  Affichage de {pagination.from || 1} à {pagination.to || filteredAndSortedProducts.length} sur {pagination.total} résultats
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                    disabled={pagination.current_page === 1}
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Précédent</span>
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-700 px-2 py-1 bg-gray-100 rounded">
                      Page {pagination.current_page} sur {pagination.last_page}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                    disabled={pagination.current_page === pagination.last_page}
                    className="flex items-center gap-2"
                  >
                    <span className="hidden sm:inline">Suivant</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modale de confirmation de suppression */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Supprimer le produit"
          message={`Êtes-vous sûr de vouloir supprimer le produit "${selectedProduct?.name}" ? Cette action est irréversible.`}
          confirmText="Supprimer"
          loading={actionLoading}
          variant="danger"
        />

        {/* Formulaire de produit */}
        <ProductForm
          isOpen={showProductModal}
          onClose={() => handleModalClose('product')}
          onSubmit={handleProductSubmit}
          product={editingProduct}
          categories={categories}
          loading={actionLoading}
          errors={formErrors}
        />

        {/* Formulaire de création en masse */}
        <BatchProductForm
          isOpen={showBatchModal}
          onClose={() => setShowBatchModal(false)}
          onSubmit={handleBatchSubmit}
          categories={categories}
          loading={actionLoading}
          errors={formErrors}
        />

        {/* Modales pour la gestion des médias et variantes */}
        {showImagesModal && selectedProduct && (
          <ImageManager
            product={selectedProduct}
            onClose={() => handleModalClose('images')}
            onUpdate={handleModalUpdate}
          />
        )}

        {showVariantsModal && selectedProduct && (
          <VariantManager
            product={selectedProduct}
            onClose={() => handleModalClose('variants')}
            onUpdate={handleModalUpdate}
          />
        )}

        {/* Notifications */}
        <NotificationContainer
          notifications={notifications}
          onRemove={removeNotification}
        />
    </div>
  );
};

export default Products;
