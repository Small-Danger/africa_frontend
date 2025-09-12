import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ShoppingBagIcon,
  UserIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  BoltIcon,
  StarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Select, SelectOption } from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import StatsCard from '../../components/ui/StatsCard';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import NotificationToast from '../../components/ui/NotificationToast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const Customers = () => {
  // États principaux
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  
  // États pour l'interface améliorée
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  // Données par défaut (vides) - l'application consomme uniquement l'API
  const defaultStats = {
    total_clients: 0,
    active_clients: 0,
    blocked_clients: 0,
    new_clients_this_month: 0,
    active_percentage: 0,
    total_orders: 0,
    total_revenue: 0,
    avg_order_value: 0,
    retention_rate: 0
  };
  
  const defaultCustomers = [];

  // États pour les modales et actions
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null);
  const [notification, setNotification] = useState(null);

  // Configuration de l'API
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.afrikraga.com/api'; // URL du serveur backend
  const token = localStorage.getItem('auth_token');
  
  // Vérifier si le token existe
  useEffect(() => {
    if (!token) {
      console.warn('Aucun token d\'authentification trouvé');
      setNotification({
        type: 'warning',
        title: 'Authentification',
        message: 'Veuillez vous connecter pour accéder aux données'
      });
    }
  }, [token]);

  // Headers pour les requêtes API
  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  // Fonctions utilitaires pour l'interface
  const formatCurrency = useCallback((amount) => {
    if (!amount || isNaN(amount)) return '0 FCFA';
    return `${Math.round(Number(amount))} FCFA`;
  }, []);

  const getCustomerTypeBadge = useCallback((type) => {
    const types = {
      'vip': { color: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white', icon: StarIcon, text: 'VIP' },
      'regular': { color: 'bg-blue-100 text-blue-800', icon: UsersIcon, text: 'Régulier' },
      'new': { color: 'bg-green-100 text-green-800', icon: SparklesIcon, text: 'Nouveau' }
    };
    return types[type] || types['regular'];
  }, []);

  const getTimeAgo = useCallback((dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 168) return `Il y a ${Math.floor(diffInHours / 24)}j`;
    return date.toLocaleDateString('fr-FR');
  }, []);

  // Les clients sont déjà triés et filtrés côté serveur

  // Récupérer les statistiques des clients
  const fetchStats = useCallback(async () => {
    try {
      console.log('Tentative de récupération des statistiques...');
      console.log('Headers:', getHeaders());
      
      const response = await fetch(`${API_BASE_URL}/admin/customers/stats`, {
        headers: getHeaders()
      });
      
      console.log('Réponse stats:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Données stats reçues:', data);
        if (data.success) {
          // Les données de l'API sont déjà dans le bon format
          console.log('Données stats brutes de l\'API:', data.data);
          setStats(data.data || defaultStats);
          setIsUsingDemoData(false);
          setApiError(null);
          return true; // Succès
        } else {
          console.log('API stats échouée - réponse non réussie');
          throw new Error(data.message || 'API response not successful');
        }
      } else {
        const errorData = await response.text();
        console.error('Erreur stats:', errorData);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      setApiError(error.message);
      setStats(defaultStats);
      throw error; // Propager l'erreur
    }
  }, []);

  // Récupérer la liste des clients
  const fetchCustomers = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        per_page: perPage,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(sortField && { sort_by: sortField }),
        ...(sortDirection && { sort_order: sortDirection })
      });

      console.log('Tentative de récupération des clients...');
      console.log('URL:', `${API_BASE_URL}/admin/customers?${params}`);
      console.log('Headers:', getHeaders());

      const response = await fetch(`${API_BASE_URL}/admin/customers?${params}`, {
        headers: getHeaders()
      });
      
      console.log('Réponse clients:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Données clients reçues:', data);
        if (data.success) {
          // Les données sont déjà dans le bon format du CustomerController
          setCustomers(data.data.clients || []);
          setTotalCustomers(data.data.pagination?.total || 0);
          setLastPage(data.data.pagination?.last_page || 1);
          setIsUsingDemoData(false);
          setApiError(null);
          
          // Log des filtres appliqués pour debug
          console.log('Filtres appliqués:', data.data.filters);
          console.log('Clients reçus:', data.data.clients?.length || 0);
          
          return true; // Succès
        } else {
          console.log('API clients échouée - réponse non réussie');
          throw new Error(data.message || 'API response not successful');
        }
      } else {
        const errorData = await response.text();
        console.error('Erreur clients:', errorData);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      setApiError(error.message);
      setCustomers([]);
      setTotalCustomers(0);
      setLastPage(1);
      throw error; // Propager l'erreur
    }
  }, [currentPage, perPage, searchTerm, selectedStatus, sortField, sortDirection]);

  // Changer le statut d'un client (bloquer/débloquer)
  const toggleCustomerStatus = async (customerId, action) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/customers/toggle-status`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          client_id: customerId,
          action: action
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotification({
            type: 'success',
            title: 'Succès',
            message: data.message
          });
          // Rafraîchir les données
          try {
            await Promise.all([fetchCustomers(), fetchStats()]);
          } catch (refreshError) {
            console.log('Erreur lors du rafraîchissement');
            setApiError(refreshError.message);
        }
      } else {
          throw new Error(data.message || 'Erreur lors de la modification du statut');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        throw new Error(errorData.message || 'Erreur lors de la modification du statut');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({
        type: 'error',
        title: 'Erreur',
        message: error.message || 'Impossible de modifier le statut du client'
      });
    }
  };

  // Gérer les actions de contact
  const handleContact = (customer, method) => {
    if (method === 'phone') {
      window.open(`tel:${customer.whatsapp_phone}`);
    } else if (method === 'whatsapp') {
      const phone = customer.whatsapp_phone.replace(/\s/g, '');
      window.open(`https://wa.me/${phone}`);
    } else if (method === 'email' && customer.email) {
      window.open(`mailto:${customer.email}`);
    }
  };

  // Récupérer les détails d'un client spécifique
  const fetchCustomerDetails = useCallback(async (customerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/customers/${customerId}`, {
        headers: getHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data.client;
        } else {
          throw new Error('API response not successful');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du client:', error);
      throw error;
    }
  }, []);

  // Ouvrir la modale de profil client
  const openCustomerProfile = async (customer) => {
    try {
      // Récupérer les détails complets du client
      const customerDetails = await fetchCustomerDetails(customer.id);
      setSelectedCustomer(customerDetails);
      setShowCustomerModal(true);
    } catch (error) {
      // En cas d'erreur, utiliser les données de base
      setSelectedCustomer(customer);
      setShowCustomerModal(true);
      console.log('Utilisation des données de base du client');
    }
  };

  // Confirmer une action
  const confirmAction = (action, customer) => {
    setActionToConfirm({ action, customer });
    setShowConfirmDialog(true);
  };

  // Exécuter l'action confirmée
  const executeConfirmedAction = () => {
    if (actionToConfirm) {
      const { action, customer } = actionToConfirm;
      if (action === 'block') {
        toggleCustomerStatus(customer.id, 'block');
      } else if (action === 'unblock') {
        toggleCustomerStatus(customer.id, 'unblock');
      }
      setShowConfirmDialog(false);
      setActionToConfirm(null);
    }
  };

    // Effet pour charger les données initiales
  useEffect(() => {
    // Charger uniquement les données de l'API
    const loadData = async () => {
      setLoading(true);
      setApiError(null);
      try {
        console.log('Tentative de chargement des données depuis l\'API...');
        await Promise.all([fetchStats(), fetchCustomers()]);
        console.log('Données chargées avec succès depuis l\'API');
        setIsUsingDemoData(false);
      } catch (error) {
        console.log('Erreur lors du chargement des données:', error);
        setApiError(error.message);
        setIsUsingDemoData(false);
        // Ne pas utiliser de données de fallback - laisser les données vides
        setStats(defaultStats);
        setCustomers(defaultCustomers);
        setTotalCustomers(0);
        setLastPage(1);
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
  }, [fetchStats, fetchCustomers, token]);

  // Effet pour recharger les clients quand les paramètres changent
  useEffect(() => {
    if (!loading) {
      fetchCustomers();
    }
  }, [currentPage, perPage, searchTerm, selectedStatus, sortField, sortDirection, fetchCustomers, loading]);

  // Gestion de la sélection
  const handleSelectCustomer = (customerId) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c.id));
    }
  };

  // Colonnes pour le tableau de données améliorées
  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedCustomers.length === customers.length && customers.length > 0}
          onChange={handleSelectAll}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      render: (customer) => (
        <input
          type="checkbox"
          checked={selectedCustomers.includes(customer.id)}
          onChange={() => handleSelectCustomer(customer.id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      width: 'w-12'
    },
    {
             key: 'name',
       label: 'Client',
      sortable: true,
       render: (customer) => (
         <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">
                 {customer?.name ? customer.name.charAt(0).toUpperCase() : '?'}
               </span>
             </div>
            {customer?.customer_type === 'vip' && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <StarIcon className="h-3 w-3 text-white" />
           </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <div className="font-semibold text-gray-900 truncate">{customer?.name || 'Nom inconnu'}</div>
              {customer?.customer_type && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getCustomerTypeBadge(customer.customer_type).color}`}
                >
                  {getCustomerTypeBadge(customer.customer_type).text}
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-500 truncate">{customer?.email || 'Aucun email'}</div>
            <div className="text-xs text-gray-400">
              Inscrit {getTimeAgo(customer?.created_at)}
            </div>
           </div>
         </div>
       )
    },
    {
      key: 'contact',
       label: 'Contact',
       render: (customer) => (
        <div className="space-y-2">
           <div className="flex items-center space-x-2">
            <ChatBubbleLeftRightIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-900">{customer?.whatsapp_phone || 'Non renseigné'}</span>
           </div>
           {customer?.email && (
             <div className="flex items-center space-x-2">
              <EnvelopeIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span className="text-xs text-gray-500 truncate">{customer.email}</span>
            </div>
          )}
          {customer?.last_login && (
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-400">Dernière connexion: {getTimeAgo(customer.last_login)}</span>
             </div>
           )}
         </div>
       )
    },
    {
             key: 'status',
       label: 'Statut',
      sortable: true,
       render: (customer) => (
        <div className="flex flex-col space-y-2">
           {customer?.is_active ? (
            <Badge variant="success" className="flex items-center space-x-1 w-fit">
               <CheckCircleIcon className="h-3 w-3" />
               <span>Actif</span>
             </Badge>
           ) : (
            <Badge variant="secondary" className="flex items-center space-x-1 w-fit">
               <XCircleIcon className="h-3 w-3" />
               <span>Bloqué</span>
             </Badge>
           )}
          {customer?.total_spent && (
            <div className="text-xs text-gray-500">
              {formatCurrency(customer.total_spent)} dépensé
            </div>
          )}
         </div>
       )
    },
    {
      key: 'orders',
       label: 'Commandes',
      sortable: true,
       render: (customer) => (
         <div className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <ShoppingBagIcon className="h-4 w-4 text-blue-500" />
           <div className="text-lg font-bold text-gray-900">{customer?.orders_count || 0}</div>
          </div>
           <div className="text-xs text-gray-500">commandes</div>
          {customer?.last_order && customer.last_order !== 'Aucune commande' && (
            <div className="text-xs text-gray-400 mt-1">
              Dernière: {getTimeAgo(customer.last_order)}
            </div>
          )}
         </div>
       )
    },
    {
      key: 'activity',
      label: 'Activité',
      sortable: true,
       render: (customer) => (
         <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
           <div className="text-sm font-medium text-gray-900">
              {customer?.last_order === 'Aucune commande' ? 'Nouveau' : 'Actif'}
            </div>
           </div>
           <div className="text-xs text-gray-500">
            {customer?.last_order === 'Aucune commande' ? 'Client récent' : getTimeAgo(customer.last_order)}
           </div>
         </div>
       )
    },
    {
             key: 'created_at',
       label: 'Inscription',
      sortable: true,
       render: (customer) => (
         <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <CalendarIcon className="h-4 w-4 text-blue-500" />
            <div className="text-sm font-medium text-gray-900">
              {getTimeAgo(customer?.created_at || '')}
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Membre depuis {new Date(customer?.created_at).toLocaleDateString('fr-FR')}
          </div>
         </div>
       )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (customer) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openCustomerProfile(customer)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg p-2"
            title="Voir le profil"
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
          
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleContact(customer, 'whatsapp')}
            className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg p-2"
              title="Contacter par WhatsApp"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
            </Button>
            
                         {customer?.email && (
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => handleContact(customer, 'email')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg p-2"
                 title="Envoyer un email"
               >
                 <EnvelopeIcon className="h-4 w-4" />
               </Button>
             )}

             {customer?.is_active ? (
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => confirmAction('block', customer)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg p-2"
                 title="Bloquer le client"
               >
                 <XCircleIcon className="h-4 w-4" />
               </Button>
             ) : (
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => confirmAction('unblock', customer)}
              className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg p-2"
                 title="Débloquer le client"
               >
                 <CheckCircleIcon className="h-4 w-4" />
               </Button>
             )}
        </div>
      )
    }
  ];

  // Filtres disponibles
  const statusFilters = [
    { id: '', name: 'Tous les statuts' },
    { id: 'active', name: 'Clients actifs' },
    { id: 'blocked', name: 'Clients bloqués' }
  ];

  // Gérer la recherche et les filtres
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handleSortChange = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (value) => {
    setPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // Rafraîchir les données avec animation
  const refreshData = async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      await Promise.all([fetchCustomers(), fetchStats()]);
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
      setLoading(false);
    }
  };

  // Actions en lot
  const handleBulkAction = async (action) => {
    if (selectedCustomers.length === 0) {
      setNotification({
        type: 'warning',
        title: 'Aucune sélection',
        message: 'Veuillez sélectionner au moins un client'
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/customers/bulk-action`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          client_ids: selectedCustomers,
          action: action
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedCustomers([]);
          setBulkAction('');
          
          setNotification({
            type: 'success',
            title: 'Action en lot',
            message: data.message
          });

          // Rafraîchir les données
          try {
            await Promise.all([fetchCustomers(), fetchStats()]);
          } catch (refreshError) {
            console.log('Erreur lors du rafraîchissement:', refreshError);
            setApiError(refreshError.message);
          }
        } else {
          throw new Error(data.message || 'Erreur lors de l\'action en lot');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        throw new Error(errorData.message || 'Erreur lors de l\'action en lot');
      }
    } catch (error) {
      console.error('Erreur action en lot:', error);
      setNotification({
        type: 'error',
        title: 'Erreur',
        message: error.message || 'Impossible d\'exécuter l\'action en lot'
      });
    }
  };

  // Tester la connexion au backend
  const testBackendConnection = async () => {
    try {
      setApiError(null);
      console.log('Test de connexion au backend...');
      const response = await fetch(`${API_BASE_URL}/banners`);
      console.log('Réponse test:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Backend OK:', data);
        setNotification({
          type: 'success',
          title: 'Connexion',
          message: 'Backend accessible et fonctionnel'
        });
        
        // Si le backend est accessible, essayer de récupérer les vraies données
        try {
          await Promise.all([fetchStats(), fetchCustomers()]);
          setNotification({
            type: 'success',
            title: 'Données mises à jour',
            message: 'Connexion au backend réussie et données récupérées'
          });
        } catch (apiError) {
          console.log('Backend accessible mais API clients non disponible:', apiError);
          setNotification({
            type: 'warning',
            title: 'API non accessible',
            message: 'Backend accessible mais API clients nécessite une authentification admin'
          });
        }
      } else {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setNotification({
        type: 'error',
        title: 'Connexion',
        message: `Impossible de se connecter au backend: ${error.message}`
      });
    }
  };

  // Fonction pour tester l'authentification admin
  const testAdminAuth = async () => {
    try {
      setApiError(null);
      console.log('Test d\'authentification admin...');
      console.log('URL de connexion:', `${API_BASE_URL}/auth/login`);
      
      // Essayer de se connecter avec les identifiants admin
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@bsshop.com',
          password: 'password'
        })
      });

      console.log('Réponse de connexion:', loginResponse.status, loginResponse.statusText);

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('Données de connexion:', loginData);
        
        if (loginData.success && loginData.data.token) {
          // Sauvegarder le token
          localStorage.setItem('auth_token', loginData.data.token);
          console.log('Token sauvegardé:', loginData.data.token.substring(0, 20) + '...');
          
          setNotification({
            type: 'success',
            title: 'Authentification réussie',
            message: 'Connexion admin réussie, récupération des données...'
          });

          // Maintenant essayer de récupérer les données
          try {
            console.log('Tentative de récupération des données après connexion...');
            await Promise.all([fetchStats(), fetchCustomers()]);
            
            // Vérifier que les données ont été mises à jour
            console.log('État des stats après récupération:', stats);
            
            setNotification({
              type: 'success',
              title: 'Données récupérées',
              message: 'Données de la base récupérées avec succès ! Mode API activé.'
            });
          } catch (apiError) {
            console.log('Erreur lors de la récupération des données:', apiError);
            setNotification({
              type: 'warning',
              title: 'Données partielles',
              message: 'Connexion réussie mais erreur lors de la récupération des données'
            });
          }
        } else {
          throw new Error(loginData.message || 'Échec de l\'authentification - pas de token reçu');
        }
      } else {
        const errorData = await loginResponse.text();
        console.error('Erreur de connexion:', errorData);
        throw new Error(`Erreur de connexion: ${loginResponse.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      
      let errorMessage = 'Impossible de se connecter en tant qu\'admin';
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Identifiants admin incorrects ou admin non trouvé';
      } else if (error.message.includes('404')) {
        errorMessage = 'Endpoint de connexion non trouvé. Vérifiez la configuration du backend';
      } else {
        errorMessage = error.message;
      }
      
      setNotification({
        type: 'error',
        title: 'Erreur d\'authentification',
        message: errorMessage
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête simple */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Clients</h1>
        </div>

        {/* Filtres et recherche améliorés */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">Filtres et Recherche</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {totalCustomers} client(s) trouvé(s)
                  </span>
                  {selectedCustomers.length > 0 && (
                    <Badge variant="primary" className="bg-blue-100 text-blue-800">
                      {selectedCustomers.length} sélectionné(s)
                    </Badge>
                  )}
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
                placeholder="Rechercher par nom, email ou téléphone..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 h-12 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
              />
            </div>

            {/* Filtres rapides */}
            <div className="flex flex-wrap gap-3 mb-4">
              {statusFilters.map((status) => (
                <Button
                  key={status.id}
                  variant={selectedStatus === status.id ? "primary" : "outline"}
                  onClick={() => handleStatusFilter(status.id)}
                  className="rounded-xl"
                >
                  {status.name}
                </Button>
              ))}
            </div>

            {/* Filtres avancés */}
            {showAdvancedFilters && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trier par
                    </label>
                                        <Select
                      value={sortField}
                      onChange={(e) => handleSortChange(e.target.value, sortDirection)}
                      className="rounded-xl"
                    >
                      <SelectOption value="created_at">Date d'inscription</SelectOption>
                      <SelectOption value="name">Nom</SelectOption>
                      <SelectOption value="orders_count">Nombre de commandes</SelectOption>
                      <SelectOption value="email">Email</SelectOption>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ordre
                    </label>
                    <Select
                      value={sortDirection}
                      onChange={(e) => handleSortChange(sortField, e.target.value)}
                      className="rounded-xl"
                    >
                      <SelectOption value="desc">Décroissant</SelectOption>
                      <SelectOption value="asc">Croissant</SelectOption>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Éléments par page
                    </label>
              <Select
                value={perPage.toString()}
                onChange={(e) => handlePerPageChange(e.target.value)}
                      className="rounded-xl"
              >
                <SelectOption value="10">10</SelectOption>
                <SelectOption value="25">25</SelectOption>
                <SelectOption value="50">50</SelectOption>
              </Select>
            </div>
          </div>
              </div>
            )}

            {/* Actions en lot */}
            {selectedCustomers.length > 0 && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {selectedCustomers.length} client(s) sélectionné(s)
                    </span>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedCustomers([])}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Désélectionner tout
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      placeholder="Action en lot"
                      className="rounded-xl"
                    >
                      <SelectOption value="">Choisir une action</SelectOption>
                      <SelectOption value="block">Bloquer</SelectOption>
                      <SelectOption value="unblock">Débloquer</SelectOption>
                    </Select>
                    <Button
                      variant="primary"
                      onClick={() => handleBulkAction(bulkAction)}
                      disabled={!bulkAction}
                      className="rounded-xl"
                    >
                      Appliquer
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tableau des clients amélioré */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900">Liste des Clients</h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {customers.length} client(s) affiché(s)
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
                  <p className="mt-4 text-gray-500">Chargement des clients...</p>
            </div>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <UsersIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client trouvé</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || selectedStatus ? 'Essayez de modifier vos filtres de recherche.' : 'Commencez par ajouter votre premier client.'}
                </p>
                {!searchTerm && !selectedStatus && (
                  <Button variant="primary" className="rounded-xl">
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    Ajouter un client
                  </Button>
                )}
            </div>
          ) : (
              <div className="min-h-[400px]">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {columns.map((column, index) => (
                        <th
                          key={column.key || index}
                          className={`px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                            column.width || ''
                          }`}
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer, index) => (
                      <tr
                        key={customer.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedCustomers.includes(customer.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        {columns.map((column, colIndex) => (
                          <td
                            key={column.key || colIndex}
                            className={`px-6 py-4 whitespace-nowrap ${
                              column.width || ''
                            }`}
                          >
                            {column.render ? column.render(customer) : customer[column.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination améliorée */}
          {totalCustomers > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Affichage de {((currentPage - 1) * perPage) + 1} à {Math.min(currentPage * perPage, totalCustomers)} sur {totalCustomers} résultats
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={lastPage}
                  onPageChange={handlePageChange}
                  totalItems={totalCustomers}
                  itemsPerPage={perPage}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modale de profil client améliorée */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
          title=""
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
              {/* En-tête du profil */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <span className="text-white font-bold text-2xl">
                     {selectedCustomer?.name ? selectedCustomer.name.charAt(0).toUpperCase() : '?'}
                   </span>
                 </div>
                    {selectedCustomer?.customer_type === 'vip' && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <StarIcon className="h-4 w-4 text-white" />
                 </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{selectedCustomer?.name || 'Nom inconnu'}</h3>
                    <p className="text-blue-100 mt-1">{selectedCustomer?.email || 'Aucun email'}</p>
                    <p className="text-blue-100">{selectedCustomer?.whatsapp_phone || 'Non renseigné'}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      {selectedCustomer?.customer_type && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getCustomerTypeBadge(selectedCustomer.customer_type).color}`}
                        >
                          {getCustomerTypeBadge(selectedCustomer.customer_type).text}
                        </Badge>
                      )}
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${selectedCustomer?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {selectedCustomer?.is_active ? 'Actif' : 'Bloqué'}
                      </Badge>
                    </div>
                  </div>
              </div>
            </div>

                          {/* Statistiques détaillées */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{selectedCustomer?.orders_count || 0}</div>
                  <div className="text-sm text-blue-600">Commandes</div>
                </div>
                
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CurrencyEuroIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {formatCurrency(selectedCustomer?.total_spent || 0)}
                  </div>
                  <div className="text-sm text-green-600">Total dépensé</div>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CalendarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {getTimeAgo(selectedCustomer?.created_at || '')}
                  </div>
                  <div className="text-sm text-purple-600">Membre depuis</div>
                </div>
                
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <ClockIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-orange-900">
                    {getTimeAgo(selectedCustomer?.last_login || '')}
                  </div>
                  <div className="text-sm text-orange-600">Dernière connexion</div>
                </div>
              </div>

              {/* Statistiques supplémentaires si disponibles */}
              {selectedCustomer?.avg_order_value && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-indigo-50 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <CurrencyEuroIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="text-xl font-bold text-indigo-900">
                      {formatCurrency(selectedCustomer.avg_order_value)}
                    </div>
                    <div className="text-sm text-indigo-600">Valeur moyenne des commandes</div>
                  </div>
                  
                  <div className="bg-teal-50 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <ArrowTrendingUpIcon className="h-6 w-6 text-teal-600" />
                    </div>
                    <div className="text-xl font-bold text-teal-900">
                      {selectedCustomer.customer_type === 'vip' ? 'VIP' : 
                       selectedCustomer.customer_type === 'regular' ? 'Régulier' : 'Nouveau'}
                    </div>
                    <div className="text-sm text-teal-600">Type de client</div>
                  </div>
                </div>
              )}

                          {/* Commandes récentes si disponibles */}
              {selectedCustomer?.recent_orders && selectedCustomer.recent_orders.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Commandes récentes</h4>
                  <div className="space-y-3">
                    {selectedCustomer.recent_orders.slice(0, 5).map((order, index) => (
                      <div key={order.id || index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <ShoppingBagIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Commande #{order.id}</div>
                            <div className="text-sm text-gray-500">{order.created_at}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            order.status === 'acceptée' ? 'bg-green-100 text-green-800' :
                            order.status === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'annulée' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions rapides */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Actions rapides</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleContact(selectedCustomer, 'whatsapp')}
                    className="flex items-center justify-center space-x-2 rounded-xl border-green-200 text-green-700 hover:bg-green-50"
              >
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    <span>Contacter par WhatsApp</span>
              </Button>
                  
                             {selectedCustomer?.email && (
                 <Button
                   variant="outline"
                   onClick={() => handleContact(selectedCustomer, 'email')}
                      className="flex items-center justify-center space-x-2 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                 >
                      <EnvelopeIcon className="h-5 w-5" />
                      <span>Envoyer un email</span>
                 </Button>
               )}
                  
                  <Button 
                    variant="outline"
                    className="flex items-center justify-center space-x-2 rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <ShoppingBagIcon className="h-5 w-5" />
                    <span>Voir les commandes</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="flex items-center justify-center space-x-2 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    <ChartBarIcon className="h-5 w-5" />
                    <span>Voir les statistiques</span>
                  </Button>
                </div>
            </div>

            {/* Actions de gestion */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Actions de gestion</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                                 {selectedCustomer?.is_active ? (
                   <Button
                     variant="outline"
                     onClick={() => {
                       setShowCustomerModal(false);
                       confirmAction('block', selectedCustomer);
                     }}
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                   >
                      <XCircleIcon className="h-5 w-5 mr-2" />
                      Bloquer le client
                   </Button>
                 ) : (
                   <Button
                     variant="outline"
                     onClick={() => {
                       setShowCustomerModal(false);
                       confirmAction('unblock', selectedCustomer);
                     }}
                      className="flex-1 text-green-600 border-green-200 hover:bg-green-50 rounded-xl"
                   >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Débloquer le client
                   </Button>
                 )}
                  
                  <Button 
                    variant="ghost" 
                    className="flex-1 text-gray-600 hover:bg-gray-50 rounded-xl"
                  >
                    <UserIcon className="h-5 w-5 mr-2" />
                    Modifier le profil
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

        {/* Dialogue de confirmation amélioré */}
       {actionToConfirm && (
         <ConfirmDialog
           isOpen={showConfirmDialog}
           onClose={() => setShowConfirmDialog(false)}
           onConfirm={executeConfirmedAction}
           title="Confirmer l'action"
           message={
             actionToConfirm.action === 'block'
                ? `Êtes-vous sûr de vouloir bloquer ${actionToConfirm.customer.name} ? Cette action empêchera le client d'accéder à son compte.`
                : `Êtes-vous sûr de vouloir débloquer ${actionToConfirm.customer.name} ? Le client pourra à nouveau accéder à son compte.`
           }
           confirmText={actionToConfirm.action === 'block' ? 'Bloquer' : 'Débloquer'}
           variant={actionToConfirm.action === 'block' ? 'danger' : 'success'}
         />
       )}

        {/* Notifications améliorées */}
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

export default Customers;
