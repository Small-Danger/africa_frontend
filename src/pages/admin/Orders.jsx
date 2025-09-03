import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Select, SelectOption } from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import StatsCard from '../../components/ui/StatsCard';
import FilterPanel from '../../components/ui/FilterPanel';
import EmptyState from '../../components/ui/EmptyState';
import OrderDetailsModal from '../../components/admin/OrderDetailsModal';
import { orderService, authService } from '../../services/api';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0
  });
  const [summary, setSummary] = useState({
    total_orders: 0,
    total_revenue: 0,
    status_breakdown: {
      en_attente: 0,
      acceptée: 0,
      prête: 0,
      en_cours: 0,
      disponible: 0,
      annulée: 0
    }
  });

  // Charger les commandes
  const loadOrders = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        page,
        per_page: 20
      };
      
      if (selectedStatus) {
        filters.status = selectedStatus;
      }
      
      const response = await orderService.getAllOrders(filters);
      
      if (response.success) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
        setSummary(response.data.summary);
      } else {
        setError(response.message || 'Erreur lors du chargement des commandes');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des commandes:', err);
      
      // Gérer les erreurs d'authentification
      if (err.status === 401) {
        setError('Session expirée. Redirection vers la page de connexion...');
        setTimeout(() => {
          authService.logout();
          navigate('/auth/login');
        }, 2000);
      } else if (err.status === 403) {
        setError('Accès refusé. Vous n\'avez pas les droits d\'administrateur.');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(err.message || 'Erreur de connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  // Charger les commandes au montage du composant
  useEffect(() => {
    // Vérifier l'authentification et les droits d'admin
    if (!authService.isAuthenticated()) {
      setError('Vous devez être connecté pour accéder à cette page');
      setLoading(false);
      // Rediriger vers la page de connexion après 2 secondes
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
      return;
    }

    if (!authService.isAdmin()) {
      setError('Vous devez avoir les droits d\'administrateur pour accéder à cette page');
      setLoading(false);
      // Rediriger vers la page d'accueil après 2 secondes
      setTimeout(() => {
        navigate('/');
      }, 2000);
      return;
    }

    loadOrders();
  }, []);

  // Recharger quand les filtres changent
  useEffect(() => {
    if (!loading) {
      loadOrders(1);
    }
  }, [selectedStatus]);

  // Configuration des colonnes pour DataTable
  const columns = useMemo(() => [
    {
      key: 'order_number',
      label: 'Commande',
      searchable: true,
      render: (value, order) => (
        <div>
          <div className="font-semibold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">
            {new Date(order.created_at).toLocaleDateString('fr-FR')}
          </div>
        </div>
      )
    },
    {
      key: 'client',
      label: 'Client',
      searchable: true,
      render: (value) => (
        <div>
          <div className="font-medium text-gray-900">{value.name}</div>
          <div className="text-sm text-gray-500">{value.whatsapp_phone}</div>
        </div>
      )
    },
    {
      key: 'total_amount',
      label: 'Montant',
      render: (value) => (
        <div className="font-semibold text-gray-900">
          {Math.round(Number(value) || 0)} FCFA
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (value, order) => (
        <div className="flex items-center space-x-2">
          {getStatusBadge(value)}
          {order.updated && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Récemment mis à jour"></div>
          )}
        </div>
      )
    },
    {
      key: 'items_summary',
      label: 'Articles',
      render: (value) => (
        <div className="text-sm text-gray-600">
          {value.items_count} articles
        </div>
      )
    }
  ], []);

  // Actions pour chaque ligne
  const rowActions = (order) => (
    <div className="flex items-center space-x-1">
      {/* Actions de contact */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleContact(order.client, 'phone')}
        title="Appeler le client"
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        <PhoneIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleContact(order.client, 'whatsapp')}
        title="Contacter sur WhatsApp"
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
      >
        <ChatBubbleLeftRightIcon className="h-4 w-4" />
      </Button>
      
      {/* Actions de statut pour les commandes en attente */}
      {order.status === 'en_attente' && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStatusChange(order.id, 'validée')}
            disabled={updatingOrder === order.id}
            title="Valider la commande"
            className="text-green-600 hover:text-green-700 hover:bg-green-50 disabled:opacity-50"
          >
            {updatingOrder === order.id ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            ) : (
              <CheckIcon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStatusChange(order.id, 'annulée')}
            disabled={updatingOrder === order.id}
            title="Annuler la commande"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {updatingOrder === order.id ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            ) : (
              <XMarkIcon className="h-4 w-4" />
            )}
          </Button>
        </>
      )}
      
      {/* Action voir détails */}
      <Button
        variant="ghost"
        size="sm"
        title="Voir les détails"
        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
      >
        <EyeIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  // Filtrer les commandes localement pour la recherche
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client.whatsapp_phone.includes(searchTerm);
      
      return matchesSearch;
    });
  }, [orders, searchTerm]);

  // Gérer le changement de statut d'une commande
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId);
      
      const response = await orderService.updateOrderStatus(orderId, newStatus);
      
      if (response.success) {
        // Mettre à jour la commande dans la liste avec une transition fluide
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: newStatus, updated: true }
              : order
          )
        );
        
        // Recharger les données pour mettre à jour les statistiques
        await loadOrders(pagination.current_page);
        
        // Feedback visuel de succès
        const statusLabels = {
          'acceptée': 'acceptée',
          'prête': 'marquée comme prête',
          'en_cours': 'mise en cours de livraison',
          'disponible': 'marquée comme disponible',
          'annulée': 'annulée'
        };
        
        // Vous pouvez ajouter ici un système de toast/notification
        console.log(`✅ Commande ${orderId} ${statusLabels[newStatus]} avec succès`);
        
        // Retirer l'indicateur de mise à jour après un délai
        setTimeout(() => {
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === orderId 
                ? { ...order, updated: false }
                : order
            )
          );
        }, 2000);
        
      } else {
        setError(response.message || 'Erreur lors de la mise à jour du statut');
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setUpdatingOrder(null);
    }
  };

  // Contacter le client
  const handleContact = (customer, method) => {
    if (method === 'phone') {
      window.open(`tel:${customer.whatsapp_phone}`);
    } else if (method === 'whatsapp') {
      const phoneNumber = customer.whatsapp_phone.replace(/\s/g, '');
      window.open(`https://wa.me/${phoneNumber}`);
    }
  };

  // Gérer la pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      loadOrders(newPage);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'en_attente': 'warning',
      'acceptée': 'success',
      'prête': 'info',
      'en_cours': 'primary',
      'disponible': 'success',
      'annulée': 'destructive'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getStatusColor = (status) => {
    const colors = {
      'en_attente': 'text-yellow-600 bg-yellow-50',
      'acceptée': 'text-green-600 bg-green-50',
      'prête': 'text-blue-600 bg-blue-50',
      'en_cours': 'text-purple-600 bg-purple-50',
      'disponible': 'text-green-600 bg-green-50',
      'annulée': 'text-red-600 bg-red-50'
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const statuses = [
    { id: '', name: 'Tous les statuts' },
    { id: 'en_attente', name: 'En attente' },
    { id: 'acceptée', name: 'Acceptée' },
    { id: 'prête', name: 'Prête à livrer' },
    { id: 'en_cours', name: 'En cours de livraison' },
    { id: 'disponible', name: 'Disponible au bureau' },
    { id: 'annulée', name: 'Annulée' }
  ];

  const periods = [
    { id: '', name: 'Toutes les périodes' },
    { id: 'today', name: 'Aujourd\'hui' },
    { id: 'week', name: 'Cette semaine' },
    { id: 'month', name: 'Ce mois' }
  ];

  // Configuration des filtres avancés
  const filterConfig = [
    {
      name: 'status',
      label: 'Statut',
      type: 'select',
      options: [
        { value: 'en_attente', label: 'En attente' },
        { value: 'acceptée', label: 'Acceptée' },
        { value: 'prête', label: 'Prête à livrer' },
        { value: 'en_cours', label: 'En cours de livraison' },
        { value: 'disponible', label: 'Disponible au bureau' },
        { value: 'annulée', label: 'Annulée' }
      ]
    },
    {
      name: 'date_from',
      label: 'Date de début',
      type: 'date'
    },
    {
      name: 'date_to',
      label: 'Date de fin',
      type: 'date'
    },
    {
      name: 'amount_min',
      label: 'Montant minimum',
      type: 'range',
      minPlaceholder: 'Min (FCFA)',
      maxPlaceholder: 'Max (FCFA)'
    }
  ];

  // Gestion des filtres
  const handleFilterApply = (filters) => {
    setAppliedFilters(filters);
    setShowFilters(false);
    // Ici vous pourriez appliquer les filtres au backend
  };

  const handleFilterReset = () => {
    setAppliedFilters({});
    setShowFilters(false);
  };

  // Gérer l'ouverture du modal de détails
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // Gérer la fermeture du modal
  const handleCloseModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  // Afficher l'état de chargement
  if (loading && orders.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Commandes</h1>
            <p className="mt-1 text-sm lg:text-base text-gray-600">
              Gérez et suivez toutes vos commandes
            </p>
          </div>
        </div>
        
        <EmptyState
          icon={DocumentTextIcon}
          title="Chargement des commandes"
          description="Récupération des données en cours..."
          className="py-12"
        />
      </div>
    );
  }

  // Afficher l'erreur
  if (error && orders.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Commandes</h1>
            <p className="mt-1 text-sm lg:text-base text-gray-600">
              Gérez et suivez toutes vos commandes
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={ExclamationTriangleIcon}
              title="Erreur de chargement"
              description={error}
              action={{
                label: "Réessayer",
                onClick: () => loadOrders(),
                icon: DocumentTextIcon
              }}
              className="py-8"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Commandes</h1>
          <p className="mt-1 text-sm lg:text-base text-gray-600">
            Gérez et suivez toutes vos commandes
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <Button 
            variant="outline" 
            className="flex items-center justify-center"
            size="sm"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
          <Button 
            variant="primary" 
            className="flex items-center justify-center"
            size="sm"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Vue d'ensemble</span>
          </Button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Filtres rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Rechercher une commande..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {statuses.map((status) => (
                  <SelectOption key={status.id} value={status.id}>
                    {status.name}
                  </SelectOption>
                ))}
              </Select>
              <Select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                {periods.map((period) => (
                  <SelectOption key={period.id} value={period.id}>
                    {period.name}
                  </SelectOption>
                ))}
              </Select>
            </div>
            
            {/* Filtres avancés */}
            <div className="flex items-center justify-between">
              <FilterPanel
                filters={filterConfig}
                onApply={handleFilterApply}
                onReset={handleFilterReset}
                isOpen={showFilters}
                onToggle={() => setShowFilters(!showFilters)}
              />
              
              {/* Indicateur de filtres actifs */}
              {Object.keys(appliedFilters).length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {Object.keys(appliedFilters).length} filtre(s) actif(s)
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFilterReset}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-6">
        <StatsCard
          name="En attente"
          value={summary.status_breakdown.en_attente}
          icon={ClockIcon}
          color="bg-yellow-500"
          loading={loading}
        />
        <StatsCard
          name="Acceptées"
          value={summary.status_breakdown.acceptée}
          icon={CheckCircleIcon}
          color="bg-green-500"
          loading={loading}
        />
        <StatsCard
          name="Prêtes"
          value={summary.status_breakdown.prête}
          icon={CheckCircleIcon}
          color="bg-blue-500"
          loading={loading}
        />
        <StatsCard
          name="En cours"
          value={summary.status_breakdown.en_cours}
          icon={ClockIcon}
          color="bg-purple-500"
          loading={loading}
        />
        <StatsCard
          name="Disponibles"
          value={summary.status_breakdown.disponible}
          icon={CheckCircleIcon}
          color="bg-green-600"
          loading={loading}
        />
        <StatsCard
          name="Total"
          value={summary.total_orders}
          icon={DocumentTextIcon}
          color="bg-gray-500"
          loading={loading}
        />
      </div>

      {/* Liste des commandes détaillée */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Mise à jour...</p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              icon={DocumentTextIcon}
              title="Aucune commande trouvée"
              description="Aucune commande ne correspond à vos critères de recherche"
            />
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <div key={order.id} className={`p-6 rounded-xl border-l-4 ${getStatusColor(order.status)}`}>
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                    {/* Informations principales */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{order.order_number}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">{Math.round(Number(order.total_amount) || 0)} FCFA</p>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                      
                      {/* Client */}
                      <div className="mb-4">
                        <p className="font-medium text-gray-900">{order.client.name}</p>
                        <p className="text-sm text-gray-600">{order.client.whatsapp_phone}</p>
                      </div>

                      {/* Détails des produits commandés */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Produits commandés :</h4>
                        <div className="space-y-2">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item, index) => (
                              <div key={index} className="flex items-center justify-between bg-white rounded-md p-3">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{item.product_name}</p>
                                  {item.variant_name && (
                                    <p className="text-sm text-gray-600">Variante: {item.variant_name}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-gray-900">Quantité: {item.quantity}</p>
                                  <p className="text-sm text-gray-600">{Math.round(Number(item.price) || 0)} FCFA</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-600 text-sm">Aucun détail de produit disponible</p>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total articles: {order.items_summary?.total_items || 0}</span>
                            <span className="font-semibold text-gray-900">Total: {Math.round(Number(order.total_amount) || 0)} FCFA</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-3 lg:ml-6 lg:min-w-[200px]">
                      {/* Actions de contact */}
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContact(order.client, 'phone')}
                          className="flex-1"
                        >
                          <PhoneIcon className="h-4 w-4 mr-2" />
                          Appeler
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContact(order.client, 'whatsapp')}
                          className="flex-1"
                        >
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                          WhatsApp
                        </Button>
                      </div>

                      {/* Actions de statut selon l'état actuel */}
                      {order.status === 'en_attente' && (
                        <div className="space-y-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleStatusChange(order.id, 'acceptée')}
                            disabled={updatingOrder === order.id}
                            className="w-full"
                          >
                            {updatingOrder === order.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <CheckIcon className="h-4 w-4 mr-2" />
                            )}
                            Accepter la commande
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStatusChange(order.id, 'annulée')}
                            disabled={updatingOrder === order.id}
                            className="w-full"
                          >
                            {updatingOrder === order.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <XMarkIcon className="h-4 w-4 mr-2" />
                            )}
                            Annuler
                          </Button>
                        </div>
                      )}

                      {order.status === 'acceptée' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleStatusChange(order.id, 'prête')}
                          disabled={updatingOrder === order.id}
                          className="w-full"
                        >
                          {updatingOrder === order.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckIcon className="h-4 w-4 mr-2" />
                          )}
                          Commande prête
                        </Button>
                      )}

                      {order.status === 'prête' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleStatusChange(order.id, 'en_cours')}
                          disabled={updatingOrder === order.id}
                          className="w-full"
                        >
                          {updatingOrder === order.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckIcon className="h-4 w-4 mr-2" />
                          )}
                          En cours de livraison
                        </Button>
                      )}

                      {order.status === 'en_cours' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleStatusChange(order.id, 'disponible')}
                          disabled={updatingOrder === order.id}
                          className="w-full"
                        >
                          {updatingOrder === order.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckIcon className="h-4 w-4 mr-2" />
                          )}
                          Disponible au bureau
                        </Button>
                      )}

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleViewDetails(order)}
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        Voir détails
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Affichage de {((pagination.current_page - 1) * pagination.per_page) + 1} à {Math.min(pagination.current_page * pagination.per_page, pagination.total)} sur {pagination.total} commandes
              </p>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page <= 1}
                >
                  Précédent
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.current_page} sur {pagination.last_page}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page >= pagination.last_page}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de détails de commande */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={showOrderModal}
        onClose={handleCloseModal}
        onContact={handleContact}
        onStatusChange={handleStatusChange}
        updatingOrder={updatingOrder}
      />
    </div>
  );
};

export default Orders;


