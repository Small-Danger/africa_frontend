import React, { useState, useEffect, useCallback } from 'react';
import { 
  PhotoIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CalendarIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Select, SelectOption } from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import NotificationToast from '../../components/ui/NotificationToast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const Banners = () => {
  // États principaux
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  // États pour les modales et actions
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [actionToConfirm, setActionToConfirm] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // États pour le formulaire
  const [formData, setFormData] = useState({
    title: '',
    image: null,
    imagePreview: null,
    link_url: '',
    is_active: true,
    position: 0
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configuration de l'API
  const API_BASE_URL = 'http://192.168.11.180:8000/api';
  const token = localStorage.getItem('auth_token');
  
  // Headers pour les requêtes API
  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  // Fonctions utilitaires
  const getTimeAgo = useCallback((dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 168) return `Il y a ${Math.floor(diffInHours / 24)}j`;
    return date.toLocaleDateString('fr-FR');
  }, []);

  // Récupérer la liste des bannières
  const fetchBanners = useCallback(async () => {
    try {
      console.log('Tentative de récupération des bannières...');
      
      const response = await fetch(`${API_BASE_URL}/admin/banners`, {
        headers: getHeaders()
      });
      
      console.log('Réponse bannières:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Données bannières reçues:', data);
        if (data.success) {
          setBanners(data.data || []);
          setApiError(null);
          return true;
        } else {
          throw new Error(data.message || 'API response not successful');
        }
      } else {
        const errorData = await response.text();
        console.error('Erreur bannières:', errorData);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des bannières:', error);
      setApiError(error.message);
      setBanners([]);
      throw error;
    }
  }, []);

  // Créer une nouvelle bannière
  const createBanner = async (bannerData) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', bannerData.title);
      formDataToSend.append('link_url', bannerData.link_url || '');
      formDataToSend.append('is_active', bannerData.is_active ? '1' : '0');
      formDataToSend.append('position', bannerData.position.toString());
      
      if (bannerData.image) {
        formDataToSend.append('image_file', bannerData.image);
      }

      const response = await fetch(`${API_BASE_URL}/admin/banners`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formDataToSend
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotification({
            type: 'success',
            title: 'Succès',
            message: 'Bannière créée avec succès'
          });
          await fetchBanners();
          return true;
        } else {
          throw new Error(data.message || 'Erreur lors de la création');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        console.error('Erreur de validation:', errorData);
        throw new Error(errorData.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({
        type: 'error',
        title: 'Erreur',
        message: error.message || 'Impossible de créer la bannière'
      });
      return false;
    }
  };

  // Mettre à jour une bannière
  const updateBanner = async (bannerId, bannerData) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', bannerData.title);
      formDataToSend.append('link_url', bannerData.link_url || '');
      formDataToSend.append('is_active', bannerData.is_active ? '1' : '0');
      formDataToSend.append('position', bannerData.position.toString());
      
      if (bannerData.image) {
        formDataToSend.append('image_file', bannerData.image);
      }

      const response = await fetch(`${API_BASE_URL}/admin/banners/${bannerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formDataToSend
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotification({
            type: 'success',
            title: 'Succès',
            message: 'Bannière mise à jour avec succès'
          });
          await fetchBanners();
          return true;
        } else {
          throw new Error(data.message || 'Erreur lors de la mise à jour');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        console.error('Erreur de validation:', errorData);
        throw new Error(errorData.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({
        type: 'error',
        title: 'Erreur',
        message: error.message || 'Impossible de mettre à jour la bannière'
      });
      return false;
    }
  };

  // Supprimer une bannière
  const deleteBanner = async (bannerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/banners/${bannerId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotification({
            type: 'success',
            title: 'Succès',
            message: 'Bannière supprimée avec succès'
          });
          await fetchBanners();
          return true;
        } else {
          throw new Error(data.message || 'Erreur lors de la suppression');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        throw new Error(errorData.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({
        type: 'error',
        title: 'Erreur',
        message: error.message || 'Impossible de supprimer la bannière'
      });
      return false;
    }
  };

  // Basculer le statut d'une bannière
  const toggleBannerStatus = async (bannerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/banners/${bannerId}/toggle-status`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotification({
            type: 'success',
            title: 'Succès',
            message: 'Statut de la bannière mis à jour'
          });
          await fetchBanners();
          return true;
        } else {
          throw new Error(data.message || 'Erreur lors de la mise à jour du statut');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        throw new Error(errorData.message || 'Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({
        type: 'error',
        title: 'Erreur',
        message: error.message || 'Impossible de modifier le statut de la bannière'
      });
      return false;
    }
  };

  // Ouvrir la modale pour créer/éditer une bannière
  const openBannerModal = (banner = null) => {
    if (banner) {
      setSelectedBanner(banner);
      setIsEditing(true);
      setFormData({
        title: banner.title || '',
        image: null,
        imagePreview: banner.image_url || null,
        link_url: banner.link_url || '',
        is_active: banner.is_active,
        position: banner.position || 0
      });
    } else {
      setSelectedBanner(null);
      setIsEditing(false);
      setFormData({
        title: '',
        image: null,
        imagePreview: null,
        link_url: '',
        is_active: true,
        position: 0
      });
    }
    setFormErrors({});
    setShowBannerModal(true);
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    // Validation
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Le titre est obligatoire';
    }
    if (!formData.image && !formData.imagePreview) {
      errors.image = 'Une image est obligatoire';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      let success = false;
      if (isEditing && selectedBanner) {
        success = await updateBanner(selectedBanner.id, formData);
      } else {
        success = await createBanner(formData);
      }

      if (success) {
        setShowBannerModal(false);
        setFormData({
          title: '',
          image: null,
          imagePreview: null,
          link_url: '',
          is_active: true,
          position: 0
        });
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gérer le changement d'image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
      setFormErrors(prev => ({
        ...prev,
        image: null
      }));
    }
  };

  // Confirmer une action
  const confirmAction = (action, banner) => {
    setActionToConfirm({ action, banner });
    setShowConfirmDialog(true);
  };

  // Exécuter l'action confirmée
  const executeConfirmedAction = async () => {
    if (actionToConfirm) {
      const { action, banner } = actionToConfirm;
      if (action === 'delete') {
        await deleteBanner(banner.id);
      } else if (action === 'toggle') {
        await toggleBannerStatus(banner.id);
      }
      setShowConfirmDialog(false);
      setActionToConfirm(null);
    }
  };

  // Rafraîchir les données
  const refreshData = async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      await fetchBanners();
      setNotification({
        type: 'success',
        title: 'Actualisation',
        message: 'Données mises à jour avec succès'
      });
    } catch (error) {
      console.log('Erreur lors du rafraîchissement:', error);
      setApiError(error.message);
      setNotification({
        type: 'error',
        title: 'Erreur de connexion',
        message: 'Impossible de récupérer les données depuis l\'API'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtrer les bannières
  const filteredBanners = banners.filter(banner => {
    const matchesSearch = !searchTerm || 
      banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (banner.link_url && banner.link_url.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !selectedStatus || 
      (selectedStatus === 'active' && banner.is_active) ||
      (selectedStatus === 'inactive' && !banner.is_active);
    
    return matchesSearch && matchesStatus;
  });

  // Charger les données initiales
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setApiError(null);
      try {
        await fetchBanners();
      } catch (error) {
        console.log('Erreur lors du chargement des données:', error);
        setApiError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      loadData();
    } else {
      setLoading(false);
      setApiError('Token d\'authentification manquant');
    }
  }, [fetchBanners, token]);

  // Filtres disponibles
  const statusFilters = [
    { id: '', name: 'Tous les statuts' },
    { id: 'active', name: 'Bannières actives' },
    { id: 'inactive', name: 'Bannières inactives' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Bannières</h1>
              <p className="mt-2 text-gray-600">Gérez les bannières publicitaires de votre site</p>
            </div>
            <Button
              variant="primary"
              onClick={() => openBannerModal()}
              className="flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Nouvelle bannière</span>
            </Button>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">Filtres et Recherche</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {filteredBanners.length} bannière(s) trouvée(s)
                  </span>
                </div>
              </div>
              
              <Button
                variant="ghost"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="text-gray-600 hover:text-gray-800"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                Filtres avancés
                {showAdvancedFilters ? (
                  <ChevronUpIcon className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 ml-2" />
                )}
              </Button>
            </div>

            {/* Barre de recherche principale */}
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Rechercher par titre ou URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
              />
            </div>

            {/* Filtres rapides */}
            <div className="flex flex-wrap gap-3 mb-4">
              {statusFilters.map((status) => (
                <Button
                  key={status.id}
                  variant={selectedStatus === status.id ? "primary" : "outline"}
                  onClick={() => setSelectedStatus(status.id)}
                  className="rounded-xl"
                >
                  {status.name}
                </Button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des bannières */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900">Liste des Bannières</h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {filteredBanners.length} bannière(s) affichée(s)
                </Badge>
              </div>
              {loading && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm">Chargement...</span>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-gray-500">Chargement des bannières...</p>
                </div>
              </div>
            ) : filteredBanners.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <PhotoIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune bannière trouvée</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || selectedStatus ? 'Essayez de modifier vos filtres de recherche.' : 'Commencez par ajouter votre première bannière.'}
                </p>
                {!searchTerm && !selectedStatus && (
                  <Button variant="primary" onClick={() => openBannerModal()} className="rounded-xl">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Ajouter une bannière
                  </Button>
                )}
              </div>
            ) : (
              <div className="min-h-[400px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {filteredBanners.map((banner) => (
                    <Card key={banner.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative">
                        {banner.image_url ? (
                          <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <PhotoIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge 
                            variant={banner.is_active ? "success" : "secondary"}
                            className="text-xs"
                          >
                            {banner.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-2 truncate">{banner.title}</h4>
                        {banner.link_url && (
                          <div className="flex items-center space-x-2 mb-2">
                            <LinkIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500 truncate">{banner.link_url}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4" />
                            <span>Position: {banner.position}</span>
                          </div>
                          <span>{getTimeAgo(banner.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openBannerModal(banner)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmAction('toggle', banner)}
                            className={banner.is_active ? 
                              "text-red-600 hover:text-red-700 hover:bg-red-50" : 
                              "text-green-600 hover:text-green-700 hover:bg-green-50"
                            }
                          >
                            {banner.is_active ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmAction('delete', banner)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modale de création/édition de bannière */}
        <Modal
          isOpen={showBannerModal}
          onClose={() => setShowBannerModal(false)}
          title={isEditing ? 'Modifier la bannière' : 'Nouvelle bannière'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre de la bannière *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Entrez le titre de la bannière"
                className={formErrors.title ? 'border-red-500' : ''}
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image de la bannière *
              </label>
              <div className="space-y-4">
                {formData.imagePreview && (
                  <div className="relative">
                    <img
                      src={formData.imagePreview}
                      alt="Aperçu"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {formErrors.image && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.image}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de redirection
              </label>
              <Input
                value={formData.link_url}
                onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                placeholder="https://exemple.com (optionnel)"
                type="url"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: parseInt(e.target.value) || 0 }))}
                  type="number"
                  min="0"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <Select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'active' }))}
                >
                  <SelectOption value="active">Actif</SelectOption>
                  <SelectOption value="inactive">Inactif</SelectOption>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBannerModal(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="flex items-center space-x-2"
              >
                {isSubmitting && <LoadingSpinner size="sm" />}
                <span>{isEditing ? 'Mettre à jour' : 'Créer'}</span>
              </Button>
            </div>
          </form>
        </Modal>

        {/* Dialogue de confirmation */}
        {actionToConfirm && (
          <ConfirmDialog
            isOpen={showConfirmDialog}
            onClose={() => setShowConfirmDialog(false)}
            onConfirm={executeConfirmedAction}
            title="Confirmer l'action"
            message={
              actionToConfirm.action === 'delete'
                ? `Êtes-vous sûr de vouloir supprimer la bannière "${actionToConfirm.banner.title}" ? Cette action est irréversible.`
                : `Êtes-vous sûr de vouloir ${actionToConfirm.banner.is_active ? 'désactiver' : 'activer'} la bannière "${actionToConfirm.banner.title}" ?`
            }
            confirmText={actionToConfirm.action === 'delete' ? 'Supprimer' : (actionToConfirm.banner.is_active ? 'Désactiver' : 'Activer')}
            variant={actionToConfirm.action === 'delete' ? 'danger' : 'primary'}
          />
        )}

        {/* Notifications */}
        {notification && (
          <NotificationToast
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Banners;
