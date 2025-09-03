import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  ShoppingBag, 
  Heart, 
  Settings, 
  LogOut, 
  ArrowRight, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  ChevronRight,
  Star,
  Package,
  CreditCard,
  Gift,
  HelpCircle,
  Bell,
  Shield,
  Truck,
  RefreshCw,
  Plus,
  Minus,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { orderService, authService } from '../../services/api';

const UserProfile = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // États pour la modification des informations personnelles
  const [editingField, setEditingField] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    whatsapp_phone: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  
  // Cache pour les commandes
  const ordersCacheRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  // Cache persistant de session
  const SESSION_CACHE_KEY = 'bs_shop_user_orders_cache';
  const SESSION_CACHE_TTL = 30 * 1000; // 30 secondes pour plus de réactivité

  // Rediriger si non connecté
  useEffect(() => {
    const checkAuth = () => {
      if (!authService.isAuthenticated()) {
        navigate('/auth/login');
        return false;
      }
      return true;
    };

    if (checkAuth()) {
      loadUserOrders();
    }
  }, [navigate]);



  const loadUserOrders = useCallback(async () => {
    // Vérifier le cache de session d'abord
    try {
      const sessionCached = sessionStorage.getItem(SESSION_CACHE_KEY);
      if (sessionCached) {
        const { data, timestamp } = JSON.parse(sessionCached);
        if (Date.now() - timestamp < SESSION_CACHE_TTL) {
          setOrders(data);
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.warn('Erreur lors de la lecture du cache de session des commandes:', error);
    }

    // Vérifier le cache mémoire
    if (ordersCacheRef.current && Date.now() - ordersCacheRef.current.timestamp < 30 * 1000) { // 30 secondes
      setOrders(ordersCacheRef.current.data);
      setLoading(false);
      return;
    }

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      
      // Vérifier l'authentification avant l'appel API
      if (!authService.isAuthenticated()) {
        setOrders([]);
        return;
      }
      
      const response = await orderService.getUserOrders();
      
      if (response.success) {
        const ordersData = response.data?.orders || [];
        setOrders(ordersData);
        
        // Mettre en cache de session
        try {
          const sessionData = {
            data: ordersData,
            timestamp: Date.now()
          };
          sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(sessionData));
        } catch (error) {
          console.warn('Erreur lors de la sauvegarde du cache de session des commandes:', error);
        }
        
        // Mettre en cache mémoire
        ordersCacheRef.current = {
          data: ordersData,
          timestamp: Date.now()
        };
      } else {
        setError(response.message || 'Erreur lors de la récupération des commandes');
        setOrders([]);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setError(error.message || 'Erreur de connexion');
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
      showSuccess('Déconnexion réussie');
      navigate('/');
    } catch (error) {
      showError('Erreur lors de la déconnexion');
    }
  }, [navigate, showSuccess, showError]);

  // Fonction pour démarrer l'édition d'un champ
  const startEditing = useCallback((field) => {
    setEditingField(field);
    setEditForm(prev => ({
      ...prev,
      [field]: user[field] || ''
    }));
  }, [user]);

  // Fonction pour annuler l'édition
  const cancelEditing = useCallback(() => {
    setEditingField(null);
    setEditForm({
      name: '',
      email: '',
      whatsapp_phone: ''
    });
  }, []);

  // Fonction pour sauvegarder les modifications
  const saveProfileUpdate = useCallback(async (field) => {
    try {
      setUpdatingProfile(true);
      
      const updateData = {
        [field]: editForm[field]
      };
      
      const response = await authService.updateProfile(updateData);
      
      if (response.success) {
        showSuccess('Informations mises à jour avec succès');
        setEditingField(null);
        // Recharger les données utilisateur
        window.location.reload(); // Simple refresh pour mettre à jour les données
      } else {
        showError(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      showError('Erreur lors de la mise à jour des informations');
    } finally {
      setUpdatingProfile(false);
    }
  }, [editForm, showSuccess, showError]);

  // Fonction pour contacter le support WhatsApp
  const contactSupport = useCallback((type = 'general') => {
    const supportNumber = '+22663126843';
    let message = '';
    
    switch (type) {
      case 'support':
        message = `Bonjour, j'ai besoin d'aide avec mon compte BS Shop. Mon numéro de commande ou problème: `;
        break;
      case 'help':
        message = `Bonjour, j'ai une question concernant BS Shop. Ma question: `;
        break;
      case 'security':
        message = `Bonjour, j'ai un problème de sécurité avec mon compte BS Shop. Mon problème: `;
        break;
      default:
        message = `Bonjour, j'ai besoin d'assistance pour BS Shop. `;
    }
    
    const whatsappUrl = `https://wa.me/${supportNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }, []);



  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId);
      
      const response = await orderService.updateOrderStatus(orderId, { status: newStatus });
      
      if (response.success) {
        // Mettre à jour la commande dans la liste
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: newStatus, updated: true }
              : order
          )
        );
        
        // Mettre à jour le cache
        if (ordersCacheRef.current) {
          ordersCacheRef.current.data = ordersCacheRef.current.data.map(order => 
            order.id === orderId 
              ? { ...order, status: newStatus }
              : order
          );
        }
        
        showSuccess('Statut de la commande mis à jour');
      } else {
        showError(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      showError('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingOrder(null);
    }
  }, [showSuccess, showError]);

  const getFilteredOrders = useCallback(() => {
    if (selectedStatus === 'all') {
      return orders;
    }
    return orders.filter(order => order.status === selectedStatus);
  }, [orders, selectedStatus]);

  const getStatusOptions = useCallback(() => {
    return [
      { value: 'all', label: 'Toutes', count: orders.length },
      { value: 'en_attente', label: 'En attente', count: orders.filter(o => o.status === 'en_attente').length },
      { value: 'acceptée', label: 'Acceptées', count: orders.filter(o => o.status === 'acceptée').length },
      { value: 'prête', label: 'Prêtes', count: orders.filter(o => o.status === 'prête').length },
      { value: 'en_cours', label: 'En cours', count: orders.filter(o => o.status === 'en_cours').length },
      { value: 'disponible', label: 'Disponibles', count: orders.filter(o => o.status === 'disponible').length },
      { value: 'annulée', label: 'Annulées', count: orders.filter(o => o.status === 'annulée').length }
    ];
  }, [orders]);

  const getStatusBadge = useCallback((status) => {
    const statusConfig = {
      'en_attente': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'En attente' },
      'acceptée': { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, text: 'Acceptée' },
      'prête': { color: 'bg-purple-100 text-purple-800', icon: Package, text: 'Prête' },
      'en_cours': { color: 'bg-orange-100 text-orange-800', icon: Truck, text: 'En cours' },
      'disponible': { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Disponible' },
      'annulée': { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Annulée' }
    };

    const config = statusConfig[status] || statusConfig['en_attente'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} className="mr-1" />
        {config.text}
      </span>
    );
  }, []);

  const formatPrice = useCallback((price) => {
    if (price === null || price === undefined || price === '') return '0 FCFA';
    const numPrice = Number(price);
    if (isNaN(numPrice)) return '0 FCFA';
    return `${Math.round(numPrice)} FCFA`;
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getOrderStats = useCallback(() => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const pendingOrders = orders.filter(order => order.status === 'en_attente').length;
    const acceptedOrders = orders.filter(order => order.status === 'acceptée').length;
    const readyOrders = orders.filter(order => order.status === 'prête').length;
    const inProgressOrders = orders.filter(order => order.status === 'en_cours').length;
    const availableOrders = orders.filter(order => order.status === 'disponible').length;
    const completedOrders = orders.filter(order => order.status === 'disponible').length;

    return { 
      totalOrders, 
      totalSpent, 
      pendingOrders, 
      acceptedOrders,
      readyOrders,
      inProgressOrders,
      availableOrders,
      completedOrders 
    };
  }, [orders]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  const stats = getOrderStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header moderne avec gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Mon Compte</h1>
            <button
              onClick={handleLogout}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
          
          {/* Profil utilisateur */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{user.name}</h2>
              <p className="text-blue-100 text-sm">{user.email}</p>
              <p className="text-blue-100 text-xs">Membre depuis {formatDate(user.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="px-4 -mt-4 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
              <div className="text-xs text-gray-500">Commandes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatPrice(stats.totalSpent)}</div>
              <div className="text-xs text-gray-500">Total dépensé</div>
            </div>
          </div>
          
          {/* Statistiques détaillées des statuts */}
          {stats.totalOrders > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-2 text-xs">
                {stats.pendingOrders > 0 && (
                  <div className="text-center">
                    <div className="font-semibold text-yellow-600">{stats.pendingOrders}</div>
                    <div className="text-gray-500">En attente</div>
                  </div>
                )}
                {stats.acceptedOrders > 0 && (
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">{stats.acceptedOrders}</div>
                    <div className="text-gray-500">Acceptées</div>
                  </div>
                )}
                {stats.readyOrders > 0 && (
                  <div className="text-center">
                    <div className="font-semibold text-purple-600">{stats.readyOrders}</div>
                    <div className="text-gray-500">Prêtes</div>
                  </div>
                )}
                {stats.inProgressOrders > 0 && (
                  <div className="text-center">
                    <div className="font-semibold text-orange-600">{stats.inProgressOrders}</div>
                    <div className="text-gray-500">En cours</div>
                  </div>
                )}
                {stats.availableOrders > 0 && (
                  <div className="text-center">
                    <div className="font-semibold text-green-600">{stats.availableOrders}</div>
                    <div className="text-gray-500">Disponibles</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-4 px-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <User size={16} />
                <span>Vue d'ensemble</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-4 px-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <ShoppingBag size={16} />
                <span>Mes Commandes</span>
                {stats.pendingOrders > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {stats.pendingOrders}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-4 px-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <Settings size={16} />
                <span>Paramètres</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="px-4 pb-20">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Actions rapides */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/catalog"
                  className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <ShoppingBag size={24} className="text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-blue-900">Continuer mes achats</span>
                </Link>
                <Link
                  to="/cart"
                  className="flex flex-col items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                >
                  <Package size={24} className="text-green-600 mb-2" />
                  <span className="text-sm font-medium text-green-900">Voir mon panier</span>
                </Link>
              </div>
            </div>

            {/* Dernières commandes */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Dernières commandes</h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-blue-600 text-sm font-medium hover:text-blue-700"
                  >
                    Voir tout ({orders.length})
                  </button>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 text-sm">Chargement...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm mb-4">Aucune commande récente</p>
                  <Link
                    to="/catalog"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Découvrir nos produits
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{order.order_number || `CMD-${order.id}`}</p>
                          <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatPrice(order.total_amount)}</p>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Support et aide */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Support & Aide</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => contactSupport('support')}
                  className="w-full flex items-center justify-between p-3 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Phone size={20} className="text-yellow-600" />
                    <span className="font-medium text-yellow-900">Contacter le support</span>
                  </div>
                  <ChevronRight size={16} className="text-yellow-600" />
                </button>
                <button 
                  onClick={() => contactSupport('help')}
                  className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <HelpCircle size={20} className="text-blue-600" />
                    <span className="font-medium text-blue-900">Centre d'aide</span>
                  </div>
                  <ChevronRight size={16} className="text-blue-600" />
                </button>
                <div className="mt-3 p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <Phone size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-green-900">Support WhatsApp</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">+226 63 12 68 43</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Filtres avancés */}
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Filtrer par statut</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-blue-600 text-sm font-medium"
                >
                  {showFilters ? 'Masquer' : 'Voir tout'}
                </button>
              </div>
              
              {/* Filtres rapides */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                {getStatusOptions().map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedStatus(option.value)}
                    className={`flex-shrink-0 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedStatus === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                    {option.count > 0 && (
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                        selectedStatus === option.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {option.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Filtres détaillés */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    {getStatusOptions().slice(1).map((option) => (
                      <div key={option.value} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">{option.label}</span>
                        <span className="text-sm font-semibold text-gray-900">{option.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Liste des commandes */}
            {loading ? (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des commandes...</p>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="text-center">
                  <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {error ? 'Erreur de chargement' : 'Aucune commande'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {error ? error : 'Vous n\'avez pas encore passé de commande'}
                  </p>
                  
                  {error && (
                    <button
                      onClick={() => {
                        setError(null);
                        // Nettoyer le cache pour forcer le rechargement
                        sessionStorage.removeItem(SESSION_CACHE_KEY);
                        ordersCacheRef.current = null;
                        loadUserOrders();
                      }}
                      className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors mb-4"
                    >
                      <RefreshCw size={16} className="mr-2" />
                      Réessayer
                    </button>
                  )}
                  
                  <Link
                    to="/catalog"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    <ShoppingBag size={16} className="mr-2" />
                    Découvrir nos produits
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredOrders().map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* En-tête de la commande */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {order.order_number || `CMD-${order.id}`}
                        </h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{formatDate(order.created_at)}</span>
                        <span className="font-semibold text-gray-900">{formatPrice(order.total_amount)}</span>
                      </div>
                    </div>

                    {/* Articles de la commande */}
                    {order.items && order.items.length > 0 && (
                      <div className="p-4">
                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package size={16} className="text-gray-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {item.product_name || 'Produit non spécifié'}
                                </p>
                                {item.variant_name && (
                                  <p className="text-xs text-gray-500">{item.variant_name}</p>
                                )}
                                <p className="text-xs text-gray-500">
                                  Quantité: {item.quantity || 1} • {formatPrice(item.unit_price)}/unité
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">{formatPrice(item.total_price)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions de changement de statut */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {order.items ? `${order.items.length} article${order.items.length > 1 ? 's' : ''}` : '0 article'}
                        </div>
                        
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Informations personnelles */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h3>
              <div className="space-y-4">
                {/* Nom complet */}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <User size={20} className="text-gray-500" />
                      <span className="text-sm text-gray-500">Nom complet</span>
                    </div>
                    {editingField !== 'name' && (
                      <button 
                        onClick={() => startEditing('name')}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                  
                  {editingField === 'name' ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Votre nom complet"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveProfileUpdate('name')}
                          disabled={updatingProfile}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updatingProfile ? 'Sauvegarde...' : 'Sauvegarder'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-900">{user.name}</p>
                  )}
                </div>
                
                {/* Email */}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Mail size={20} className="text-gray-500" />
                      <span className="text-sm text-gray-500">Email</span>
                    </div>
                    {editingField !== 'email' && (
                      <button 
                        onClick={() => startEditing('email')}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                  
                  {editingField === 'email' ? (
                    <div className="space-y-3">
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="votre@email.com"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveProfileUpdate('email')}
                          disabled={updatingProfile}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updatingProfile ? 'Sauvegarde...' : 'Sauvegarder'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-900">{user.email || 'Non renseigné'}</p>
                  )}
                </div>
                
                {/* WhatsApp */}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Phone size={20} className="text-gray-500" />
                      <span className="text-sm text-gray-500">WhatsApp</span>
                    </div>
                    {editingField !== 'whatsapp_phone' && (
                      <button 
                        onClick={() => startEditing('whatsapp_phone')}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                  
                  {editingField === 'whatsapp_phone' ? (
                    <div className="space-y-3">
                      <input
                        type="tel"
                        value={editForm.whatsapp_phone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, whatsapp_phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+226 XX XX XX XX"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveProfileUpdate('whatsapp_phone')}
                          disabled={updatingProfile}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updatingProfile ? 'Sauvegarde...' : 'Sauvegarder'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-900">{user.whatsapp_phone || 'Non renseigné'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sécurité */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sécurité</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Shield size={20} className="text-blue-600" />
                    <span className="font-medium text-blue-900">Changer le mot de passe</span>
                  </div>
                  <ChevronRight size={16} className="text-blue-600" />
                </button>
                <button 
                  onClick={() => contactSupport('security')}
                  className="w-full flex items-center justify-between p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Phone size={20} className="text-green-600" />
                    <span className="font-medium text-green-900">Support sécurité</span>
                  </div>
                  <ChevronRight size={16} className="text-green-600" />
                </button>
              </div>
            </div>

            {/* Compte */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Compte</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <LogOut size={20} className="text-red-600" />
                    <span className="font-medium text-red-900">Se déconnecter</span>
                  </div>
                  <ChevronRight size={16} className="text-red-600" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
