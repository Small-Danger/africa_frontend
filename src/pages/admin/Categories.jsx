import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FolderIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PhotoIcon,
  CalendarIcon,
  TagIcon,
  ArchiveBoxIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import CategoryForm from '../../components/forms/CategoryForm';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import NotificationContainer from '../../components/ui/NotificationContainer';
import { categoryService } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../contexts/AuthContext';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);
  
  // États pour les modales
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  
  // États pour les actions
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  // États pour les filtres et l'affichage
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'created_at', 'products_count'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' ou 'desc'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [showFilters, setShowFilters] = useState(false);

  // Hook pour les notifications
  const { notifications, success, error, removeNotification } = useNotification();
  
  // Hook pour l'authentification
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Logs de débogage pour l'authentification
    console.log('=== CATEGORIES - DÉBOGAGE AUTHENTIFICATION ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    console.log('user?.role:', user?.role);
    console.log('Token dans localStorage:', localStorage.getItem('auth_token'));
    
    fetchCategories();
  }, [isAuthenticated, user]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getCategories();
      
      if (response.success && response.data) {
        const categoriesData = response.data.categories || [];
        console.log('=== DONNÉES CATÉGORIES RÉCUPÉRÉES ===');
        console.log('Categories:', categoriesData);
        categoriesData.forEach(cat => {
          console.log(`Catégorie "${cat.name}": is_active = ${cat.is_active} (type: ${typeof cat.is_active})`);
        });
        console.log('=====================================');
        setCategories(categoriesData);
      } else {
        setCategories([]);
        console.warn('Réponse API inattendue:', response);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des catégories:', err);
      error('Erreur lors du chargement des catégories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setFormErrors({});
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormErrors({});
    setShowCategoryForm(true);
  };

  const handleViewCategory = async (category) => {
    try {
      setLoading(true);
      const response = await categoryService.getCategory(category.id);
      
      if (response.success && response.data) {
        setSelectedCategory(response.data);
        setShowCategoryDetails(true);
      } else {
        error('Erreur lors du chargement des détails de la catégorie');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des détails:', err);
      error('Erreur lors du chargement des détails de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = (category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };

  const handleToggleStatus = async (category) => {
    try {
      const newStatus = !category.is_active;
      const response = await categoryService.updateCategory(category.id, {
        is_active: newStatus
      });
      
      if (response.success) {
        success(`Catégorie "${category.name}" ${newStatus ? 'activée' : 'désactivée'} avec succès`);
        await fetchCategories();
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour du statut');
      }
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err);
      error(err.message || 'Erreur lors du changement de statut de la catégorie');
    }
  };

  const handleCategorySubmit = async (data) => {
    try {
      setFormLoading(true);
      setFormErrors({});

      console.log('=== DÉBUT SOUMISSION CATÉGORIE ===');
      console.log('Données reçues:', data);
      console.log('Type de données:', typeof data);
      console.log('Est-ce un FormData?', data instanceof FormData);
      
      if (data instanceof FormData) {
        console.log('Contenu du FormData:');
        for (let [key, value] of data.entries()) {
          console.log(`${key}:`, value);
        }
      }

      let response;
      let createdCategory = null;

      if (editingCategory) {
        // Mise à jour - utiliser updateCategory du service
        console.log('Mise à jour de la catégorie:', editingCategory.id);
        response = await categoryService.updateCategory(editingCategory.id, data);
        
        if (response.success) {
          success(`Catégorie "${editingCategory.name}" mise à jour avec succès`);
          createdCategory = response.data;
        } else {
          throw new Error(response.message || 'Erreur lors de la mise à jour');
        }
      } else {
        // Création - utiliser createCategory du service
        console.log('Création d\'une nouvelle catégorie');
        response = await categoryService.createCategory(data);
        
        if (response.success) {
          success('Catégorie créée avec succès');
          createdCategory = response.data;
        } else {
          throw new Error(response.message || 'Erreur lors de la création');
        }
      }

      // DEBUG: Vérifier la présence de l'image
      console.log('=== DEBUG IMAGE ===');
      console.log('createdCategory:', createdCategory);
      console.log('data.image_main:', data.image_main);
      console.log('Type de data.image_main:', typeof data.image_main);
      console.log('Est-ce une base64?', typeof data.image_main === 'string' && data.image_main.startsWith('data:image/'));
      console.log('Clés de data:', Object.keys(data));
      console.log('==================');

      // L'image est maintenant incluse dans les données JSON (base64)
      // Plus besoin d'upload séparé

      // Recharger les données
      await fetchCategories();
      setShowCategoryForm(false);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      
      if (err.errors && typeof err.errors === 'object') {
        // Formater les erreurs pour l'affichage
        const formattedErrors = {};
        Object.keys(err.errors).forEach(key => {
          if (Array.isArray(err.errors[key])) {
            formattedErrors[key] = err.errors[key][0]; // Prendre le premier message d'erreur
          } else {
            formattedErrors[key] = err.errors[key];
          }
        });
        setFormErrors(formattedErrors);
      } else {
        error(err.message || 'Erreur lors de la sauvegarde de la catégorie');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleCategoryDelete = async () => {
    try {
      const response = await categoryService.deleteCategory(categoryToDelete.id);
      
      if (response.success) {
        success(`Catégorie "${categoryToDelete.name}" supprimée avec succès`);
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression');
      }
      
      // Recharger les données
      await fetchCategories();
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      error(err.message || 'Erreur lors de la suppression de la catégorie');
    }
  };

  const toggleExpanded = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Filtrer et trier les catégories
  const filteredAndSortedCategories = React.useMemo(() => {
    if (!Array.isArray(categories)) return [];
    
    let filtered = categories.filter(category => {
      // Filtre par recherche
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtre par statut
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && category.is_active) ||
        (statusFilter === 'inactive' && !category.is_active);
      
      return matchesSearch && matchesStatus;
    });
    
    // Tri
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'products_count':
          aValue = a.products_count || 0;
          bValue = b.products_count || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [categories, searchTerm, statusFilter, sortBy, sortOrder]);

  // Calculer les statistiques basées sur la structure de l'API
  const totalCategories = categories.length;
  const totalSubCategories = categories.reduce((sum, cat) => sum + (cat.subcategories_count || 0), 0);
  const totalProducts = categories.reduce((sum, cat) => sum + (cat.products_count || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="space-y-8 p-6">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded-lg w-64 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="mt-4 sm:mt-0 animate-pulse">
              <div className="h-12 bg-gray-200 rounded-lg w-40"></div>
            </div>
          </div>

          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-white rounded-xl border border-gray-200 p-6">
                  <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Search and filters skeleton */}
          <div className="animate-pulse">
            <div className="h-16 bg-white rounded-xl border border-gray-200"></div>
          </div>

          {/* Categories list skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-white rounded-xl border border-gray-200"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50/50">
        <div className="space-y-8 p-6">
          {/* En-tête avec titre et bouton de création */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Catégories</h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Organisez votre catalogue de produits</p>
            </div>
            <div className="flex-shrink-0">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleCreateCategory}
                className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Nouvelle catégorie</span>
                <span className="sm:hidden">Nouvelle</span>
              </Button>
            </div>
          </div>

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">{totalCategories}</div>
                <p className="text-xs sm:text-sm font-medium text-blue-700">Catégories principales</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">{totalSubCategories}</div>
                <p className="text-xs sm:text-sm font-medium text-green-700">Sous-catégories</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-200 sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">{totalProducts}</div>
                <p className="text-xs sm:text-sm font-medium text-purple-700">Total produits</p>
              </CardContent>
            </Card>
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
                      <Input
                        placeholder="Rechercher une catégorie..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-3 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
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
                      className={`flex items-center gap-2 ${showFilters ? 'bg-blue-50 text-blue-600' : ''}`}
                    >
                      <FunnelIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Filtres</span>
                    </Button>

                    {/* Sélecteur de tri */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">Trier par:</span>
                      <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                          const [newSortBy, newSortOrder] = e.target.value.split('-');
                          setSortBy(newSortBy);
                          setSortOrder(newSortOrder);
                        }}
                        className="text-xs sm:text-sm border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="name-asc">Nom (A-Z)</option>
                        <option value="name-desc">Nom (Z-A)</option>
                        <option value="created_at-desc">Plus récent</option>
                        <option value="created_at-asc">Plus ancien</option>
                        <option value="products_count-desc">Plus de produits</option>
                        <option value="products_count-asc">Moins de produits</option>
                      </select>
                    </div>

                    {/* Sélecteur de vue */}
                    <div className="flex items-center border border-gray-200 rounded-lg p-1">
                      <Button
                        variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="p-2"
                      >
                        <Squares2X2Icon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="p-2"
                      >
                        <ListBulletIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

              {/* Panneau de filtres avancés */}
              {showFilters && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Statut:</span>
                      <div className="flex items-center border border-gray-200 rounded-lg p-1">
                        <button
                          onClick={() => setStatusFilter('all')}
                          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                            statusFilter === 'all' 
                              ? 'bg-blue-100 text-blue-700 font-medium' 
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Toutes
                        </button>
                        <button
                          onClick={() => setStatusFilter('active')}
                          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                            statusFilter === 'active' 
                              ? 'bg-green-100 text-green-700 font-medium' 
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Actives
                        </button>
                        <button
                          onClick={() => setStatusFilter('inactive')}
                          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                            statusFilter === 'inactive' 
                              ? 'bg-red-100 text-red-700 font-medium' 
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Inactives
                        </button>
                      </div>
                    </div>

                    {/* Bouton pour effacer les filtres */}
                    {(searchTerm || statusFilter !== 'all') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Effacer les filtres
                      </Button>
                    )}
                  </div>
                </div>
              )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des catégories */}
        <Card className="shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Structure des catégories
              </CardTitle>
              <div className="text-sm text-gray-500">
                {filteredAndSortedCategories.length} catégorie{filteredAndSortedCategories.length > 1 ? 's' : ''}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredAndSortedCategories.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <FolderIcon className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm || statusFilter !== 'all' ? 'Aucune catégorie trouvée' : 'Aucune catégorie'}
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Essayez de modifier vos critères de recherche ou de filtres' 
                      : 'Commencez par créer votre première catégorie pour organiser vos produits'
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Button variant="primary" onClick={handleCreateCategory}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Créer ma première catégorie
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredAndSortedCategories.map(category => (
                    <div key={category.id} className="group hover:bg-gray-50/50 transition-colors duration-200">
                      {/* Catégorie principale */}
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                            {/* Image de la catégorie */}
                            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center overflow-hidden border border-blue-200 flex-shrink-0">
                              {category.image_main ? (
                                <img 
                                  src={category.image_main} 
                                  alt={category.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <PhotoIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                              )}
                            </div>
                            
                            {/* Informations de la catégorie */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{category.name}</h3>
                                <div className="flex items-center gap-2">
                                  {!category.is_active && (
                                    <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 border-red-200">
                                      Inactive
                                    </Badge>
                                  )}
                                  {category.is_active && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {category.description || 'Aucune description fournie'}
                              </p>
                              
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                                <span className="flex items-center bg-gray-100 px-2 py-1 rounded-md">
                                  <TagIcon className="h-3 w-3 mr-1.5" />
                                  {category.products_count || 0} produits
                                </span>
                                {category.subcategories_count > 0 && (
                                  <span className="flex items-center bg-gray-100 px-2 py-1 rounded-md">
                                    <FolderIcon className="h-3 w-3 mr-1.5" />
                                    {category.subcategories_count} sous-catégories
                                  </span>
                                )}
                                <span className="flex items-center bg-gray-100 px-2 py-1 rounded-md">
                                  <CalendarIcon className="h-3 w-3 mr-1.5" />
                                  {new Date(category.created_at).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center justify-between sm:justify-end space-x-1 sm:ml-4">
                            {category.subcategories_count > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpanded(category.id)}
                                title="Afficher/Masquer les sous-catégories"
                                className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
                              >
                                {expandedCategories.has(category.id) ? (
                                  <ChevronDownIcon className="h-4 w-4" />
                                ) : (
                                  <ChevronRightIcon className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            
                            <div className="flex items-center space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewCategory(category)}
                                title="Voir les détails"
                                className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                                title="Modifier"
                                className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 hover:bg-green-50 hover:text-green-600"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleToggleStatus(category)}
                                title={category.is_active ? "Désactiver" : "Activer"}
                                className={`sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 ${
                                  category.is_active 
                                    ? 'hover:bg-orange-50 hover:text-orange-600' 
                                    : 'hover:bg-green-50 hover:text-green-600'
                                }`}
                              >
                                {category.is_active ? (
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                  </svg>
                                ) : (
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteCategory(category)}
                                title="Supprimer"
                                className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50 hover:text-red-600"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sous-catégories */}
                      {category.subcategories && category.subcategories.length > 0 && expandedCategories.has(category.id) && (
                        <div className="ml-4 sm:ml-20 border-l-2 border-gray-100 pl-4 sm:pl-6 space-y-3">
                          {category.subcategories.map(subcategory => (
                            <div key={subcategory.id} className="group/sub p-3 sm:p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200 hover:shadow-sm transition-all duration-200">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  {/* Image de la sous-catégorie */}
                                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center overflow-hidden border border-green-200 flex-shrink-0">
                                    {subcategory.image_main ? (
                                      <img 
                                        src={subcategory.image_main} 
                                        alt={subcategory.name}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <PhotoIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                                    )}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-gray-900 text-sm truncate">{subcategory.name}</h4>
                                      {!subcategory.is_active && (
                                        <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 border-red-200">
                                          Inactive
                                        </Badge>
                                      )}
                                      {subcategory.is_active && (
                                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                                          Active
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500">
                                      <span className="flex items-center bg-white px-2 py-1 rounded-md border">
                                        <TagIcon className="h-3 w-3 mr-1.5" />
                                        {subcategory.products_count || 0} produits
                                      </span>
                                      <span className="flex items-center bg-white px-2 py-1 rounded-md border">
                                        <CalendarIcon className="h-3 w-3 mr-1.5" />
                                        {new Date(subcategory.created_at).toLocaleDateString('fr-FR')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Actions pour les sous-catégories */}
                                <div className="flex items-center justify-end space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleViewCategory(subcategory)}
                                    title="Voir les détails"
                                    className="sm:opacity-0 sm:group-hover/sub:opacity-100 transition-opacity duration-200 hover:bg-blue-50 hover:text-blue-600"
                                  >
                                    <EyeIcon className="h-3 w-3" />
                                  </Button>
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEditCategory(subcategory)}
                                    title="Modifier"
                                    className="sm:opacity-0 sm:group-hover/sub:opacity-100 transition-opacity duration-200 hover:bg-green-50 hover:text-green-600"
                                  >
                                    <PencilIcon className="h-3 w-3" />
                                  </Button>
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleToggleStatus(subcategory)}
                                    title={subcategory.is_active ? "Désactiver" : "Activer"}
                                    className={`sm:opacity-0 sm:group-hover/sub:opacity-100 transition-opacity duration-200 ${
                                      subcategory.is_active 
                                        ? 'hover:bg-orange-50 hover:text-orange-600' 
                                        : 'hover:bg-green-50 hover:text-green-600'
                                    }`}
                                  >
                                    {subcategory.is_active ? (
                                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                      </svg>
                                    ) : (
                                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </Button>
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDeleteCategory(subcategory)}
                                    title="Supprimer"
                                    className="sm:opacity-0 sm:group-hover/sub:opacity-100 transition-opacity duration-200 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <TrashIcon className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      <CategoryForm
        isOpen={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        onSubmit={handleCategorySubmit}
        category={editingCategory}
        loading={formLoading}
        errors={formErrors}
        parentCategories={categories.filter(cat => cat.id !== editingCategory?.id)}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleCategoryDelete}
        title="Supprimer la catégorie"
        message={`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryToDelete?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />

      {selectedCategory && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 ${showCategoryDetails ? 'block' : 'hidden'}`}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{selectedCategory.name}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCategoryDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations générales</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Slug:</span>
                      <span className="font-mono text-gray-900">{selectedCategory.slug}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <Badge variant={selectedCategory.is_main_category ? "primary" : "secondary"}>
                        {selectedCategory.is_main_category ? "Catégorie principale" : "Sous-catégorie"}
                      </Badge>
                    </div>
                    {selectedCategory.parent_category && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Catégorie parente:</span>
                        <span className="text-gray-900">{selectedCategory.parent_category.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ordre de tri:</span>
                      <span className="text-gray-900">{selectedCategory.sort_order || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Statistiques</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sous-catégories:</span>
                      <span className="text-gray-900">{selectedCategory.statistics?.subcategories_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Produits directs:</span>
                      <span className="text-gray-900">{selectedCategory.statistics?.products_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total produits:</span>
                      <span className="text-gray-900">{selectedCategory.statistics?.total_products_including_subcategories || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedCategory.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-700">{selectedCategory.description}</p>
                </div>
              )}

              {/* Image principale */}
              {selectedCategory.image_main && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Image principale</h3>
                  <div className="max-w-xs">
                    <img 
                      src={selectedCategory.image_main} 
                      alt={selectedCategory.name}
                      className="w-full h-auto rounded-lg border border-gray-200"
                    />
                  </div>
                </div>
              )}

              {/* Sous-catégories */}
              {selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Sous-catégories</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedCategory.subcategories.map(subcategory => (
                      <div key={subcategory.id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-md bg-green-100 flex items-center justify-center overflow-hidden">
                            {subcategory.image_main ? (
                              <img 
                                src={subcategory.image_main} 
                                alt={subcategory.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <PhotoIcon className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{subcategory.name}</h4>
                            <p className="text-xs text-gray-500">{subcategory.products_count || 0} produits</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Produits */}
              {selectedCategory.products && selectedCategory.products.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Produits récents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedCategory.products.map(product => (
                      <div key={product.id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center overflow-hidden">
                            {product.image_main ? (
                              <img 
                                src={product.image_main} 
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ArchiveBoxIcon className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{product.has_variants ? `${product.variants_count} variantes` : 'Prix unique'}</span>
                              <span className="font-medium">{Math.round(Number(product.min_price || product.base_price))} FCFA</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </>
  );
};

export default Categories;
