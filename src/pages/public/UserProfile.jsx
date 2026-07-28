import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  ShoppingBag,
  Settings,
  LogOut,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  XCircle,
  Pencil,
  ChevronRight,
  Package,
  HelpCircle,
  Shield,
  Truck,
  RefreshCw,
  MessageCircle,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { orderService, authService } from '../../services/api';
import { generateWhatsAppLink, CONTACT_CONFIG } from '../../config/contact';
import { formatPhoneE164Display, sanitizePhoneE164, getPhoneValidationResult } from '../../utils/phone';
import { parseAuthFormError } from '../../utils/authErrors';
import PhoneInput from '../../components/forms/PhoneInput';
import { AuthPasswordInput } from '../../components/auth/AuthLayout';

const SESSION_CACHE_KEY = 'afrikraga_user_orders_cache';
const SESSION_CACHE_TTL = 30 * 1000;

const STATUS_CONFIG = {
  en_attente: { label: 'En attente', icon: Clock, badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  acceptée: { label: 'Acceptée', icon: CheckCircle2, badge: 'bg-brand-green-light text-brand-green-dark border-brand-green/20' },
  prête: { label: 'Prête', icon: Package, badge: 'bg-brand-orange-light text-brand-orange-dark border-brand-orange/20' },
  en_cours: { label: 'En cours de livraison', icon: Truck, badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  disponible: { label: 'Livrée', icon: CheckCircle2, badge: 'bg-brand-green-light text-brand-green-dark border-brand-green/20' },
  annulée: { label: 'Annulée', icon: XCircle, badge: 'bg-red-50 text-red-700 border-red-200' },
};

const formatPrice = (price) => {
  const value = Number(price);
  if (!Number.isFinite(value)) return '0 FCFA';
  return `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
};

const formatDate = (value, withTime = false) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};

const getInitials = (name) =>
  (name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?';

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.en_attente;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge}`}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
};

const SectionCard = ({ title, description, children, action }) => (
  <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
    {(title || action) && (
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          {title && <h3 className="text-base font-bold text-gray-900">{title}</h3>}
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

const UserProfile = () => {
  const { user, logout, updateUser, refreshUser } = useAuth();
  const { showSuccess } = useNotification();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  const abortControllerRef = useRef(null);

  const loadOrders = useCallback(async ({ force = false } = {}) => {
    if (!authService.isAuthenticated()) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    if (!force) {
      try {
        const cached = sessionStorage.getItem(SESSION_CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < SESSION_CACHE_TTL) {
            setOrders(data);
            setLoadingOrders(false);
            return;
          }
        }
      } catch {
        sessionStorage.removeItem(SESSION_CACHE_KEY);
      }
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      setLoadingOrders(true);
      setOrdersError(null);

      const response = await orderService.getUserOrders();

      if (response.success) {
        const data = response.data?.orders || [];
        setOrders(data);
        try {
          sessionStorage.setItem(
            SESSION_CACHE_KEY,
            JSON.stringify({ data, timestamp: Date.now() })
          );
        } catch {
          // quota dépassé : le cache est optionnel
        }
      } else {
        setOrdersError(response.message || 'Impossible de charger vos commandes');
        setOrders([]);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setOrdersError('Connexion au serveur impossible. Vérifiez votre réseau.');
        setOrders([]);
      }
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/auth/login', { replace: true });
      return;
    }
    loadOrders();
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, loadOrders]);

  const stats = useMemo(() => {
    const countBy = (status) => orders.filter((order) => order.status === status).length;
    const totalSpent = orders
      .filter((order) => order.status !== 'annulée')
      .reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);

    return {
      totalOrders: orders.length,
      totalSpent,
      en_attente: countBy('en_attente'),
      acceptée: countBy('acceptée'),
      prête: countBy('prête'),
      en_cours: countBy('en_cours'),
      disponible: countBy('disponible'),
      annulée: countBy('annulée'),
    };
  }, [orders]);

  const statusFilters = useMemo(() => {
    const filters = [{ value: 'all', label: 'Toutes', count: orders.length }];
    Object.entries(STATUS_CONFIG).forEach(([value, config]) => {
      const count = stats[value] || 0;
      if (count > 0) {
        filters.push({ value, label: config.label, count });
      }
    });
    return filters;
  }, [orders.length, stats]);

  const filteredOrders = useMemo(
    () => (selectedStatus === 'all' ? orders : orders.filter((o) => o.status === selectedStatus)),
    [orders, selectedStatus]
  );

  const handleLogout = useCallback(async () => {
    sessionStorage.removeItem(SESSION_CACHE_KEY);
    await logout();
    showSuccess('À bientôt sur AfrikRaga !', 'Déconnexion');
    navigate('/', { replace: true });
  }, [logout, navigate, showSuccess]);

  const startEditing = (field) => {
    setEditingField(field);
    setFieldError(null);
    setEditValue(user?.[field] || '');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
    setFieldError(null);
  };

  const saveField = async (field) => {
    setFieldError(null);

    if (field === 'name' && editValue.trim().length < 2) {
      setFieldError('Le nom doit contenir au moins 2 caractères.');
      return;
    }

    if (field === 'email' && editValue.trim() && !/\S+@\S+\.\S+/.test(editValue.trim())) {
      setFieldError('Format d\'email incorrect (ex. nom@mail.com).');
      return;
    }

    if (field === 'whatsapp_phone') {
      const check = getPhoneValidationResult(editValue);
      if (!check.valid) {
        setFieldError(check.message || 'Numéro WhatsApp invalide.');
        return;
      }
    }

    const payload = {
      [field]:
        field === 'whatsapp_phone'
          ? sanitizePhoneE164(editValue)
          : editValue.trim(),
    };

    try {
      setSavingProfile(true);
      const response = await authService.updateProfile(payload);

      if (response.success) {
        updateUser(response.data.user);
        setEditingField(null);
        setEditValue('');
        showSuccess('Vos informations ont été mises à jour.');
        return;
      }

      const parsed = parseAuthFormError(response);
      setFieldError(parsed.fieldErrors[field] || parsed.message);
    } catch {
      setFieldError('Connexion au serveur impossible. Réessayez.');
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!passwordForm.current_password) {
      errors.current_password = 'Saisissez votre mot de passe actuel.';
    }
    if (!passwordForm.new_password) {
      errors.new_password = 'Choisissez un nouveau mot de passe.';
    } else if (passwordForm.new_password.length < 8) {
      errors.new_password = 'Minimum 8 caractères.';
    }
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      errors.new_password_confirmation = 'Les deux mots de passe ne correspondent pas.';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    try {
      setSavingPassword(true);
      setPasswordErrors({});
      const response = await authService.updateProfile(passwordForm);

      if (response.success) {
        showSuccess('Votre mot de passe a été modifié.');
        setPasswordOpen(false);
        setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
        return;
      }

      const parsed = parseAuthFormError(response);
      setPasswordErrors(
        Object.keys(parsed.fieldErrors).length > 0
          ? parsed.fieldErrors
          : { current_password: parsed.message }
      );
    } catch {
      setPasswordErrors({ current_password: 'Connexion au serveur impossible. Réessayez.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const contactSupport = (type) => {
    const messages = {
      support: 'Bonjour AfrikRaga ! J\'ai besoin d\'aide concernant mon compte : ',
      help: 'Bonjour AfrikRaga ! J\'ai une question : ',
      security: 'Bonjour AfrikRaga ! J\'ai un souci de sécurité sur mon compte : ',
    };
    window.open(generateWhatsAppLink(messages[type] || messages.help), '_blank', 'noopener');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-11 w-11 border-2 border-brand-green border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-gray-600">Chargement de votre compte…</p>
        </div>
      </div>
    );
  }

  const memberSince = formatDate(user.created_at);

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: User },
    { id: 'orders', label: 'Mes commandes', icon: ShoppingBag, badge: stats.totalOrders },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  const editableFields = [
    {
      field: 'name',
      label: 'Nom complet',
      icon: User,
      display: user.name,
      placeholder: 'Ex. Amina Kaboré',
    },
    {
      field: 'whatsapp_phone',
      label: 'Numéro WhatsApp',
      icon: Phone,
      display: user.whatsapp_phone ? formatPhoneE164Display(user.whatsapp_phone) : null,
      note: 'Identifiant de connexion et contact livraison',
    },
    {
      field: 'email',
      label: 'Adresse email',
      icon: Mail,
      display: user.email,
      placeholder: 'votre@email.com',
      note: 'Optionnel — permet aussi de se connecter',
    },
  ];

  return (
    <div className="min-h-screen bg-brand-cream pb-24">
      <header className="bg-brand-green text-white">
        <div className="max-w-5xl mx-auto px-4 pt-6 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Mon compte</h1>
              <p className="text-white/70 text-xs md:text-sm mt-1">
                Suivez vos commandes et gérez vos informations
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-semibold transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-18 md:h-18 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-xl font-bold flex-shrink-0">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-bold truncate">{user.name}</h2>
              <p className="text-white/85 text-sm font-medium truncate">
                {user.whatsapp_phone ? formatPhoneE164Display(user.whatsapp_phone) : 'Numéro non renseigné'}
              </p>
              <p className="text-white/60 text-xs mt-0.5">
                {memberSince ? `Membre depuis ${memberSince}` : 'Bienvenue chez AfrikRaga'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4">
        <div className="-mt-5 mb-5 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-brand-green">{stats.totalOrders}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Commande{stats.totalOrders > 1 ? 's' : ''}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-brand-orange">{formatPrice(stats.totalSpent)}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total dépensé</div>
          </div>
        </div>

        <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 mb-5 flex gap-1">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === id
                  ? 'bg-brand-green text-white'
                  : 'text-gray-600 hover:bg-brand-green-light'
              }`}
            >
              <Icon size={16} />
              <span className="text-center leading-tight">{label}</span>
              {badge > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === id ? 'bg-white/25' : 'bg-brand-orange-light text-brand-orange-dark'
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {activeTab === 'overview' && (
          <div className="space-y-5">
            <SectionCard title="Actions rapides">
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/catalog"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-brand-green-light hover:bg-brand-green/10 transition-colors"
                >
                  <ShoppingBag size={22} className="text-brand-green" />
                  <span className="text-xs sm:text-sm font-semibold text-brand-green-dark text-center">
                    Continuer mes achats
                  </span>
                </Link>
                <Link
                  to="/cart"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-brand-orange-light hover:bg-brand-orange/10 transition-colors"
                >
                  <Package size={22} className="text-brand-orange-dark" />
                  <span className="text-xs sm:text-sm font-semibold text-brand-orange-dark text-center">
                    Voir mon panier
                  </span>
                </Link>
              </div>
            </SectionCard>

            <SectionCard
              title="Dernières commandes"
              action={
                orders.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-brand-green hover:text-brand-green-dark whitespace-nowrap"
                  >
                    Voir tout ({orders.length})
                  </button>
                ) : null
              }
            >
              {loadingOrders ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-green border-t-transparent mx-auto mb-3" />
                  <p className="text-xs text-gray-500">Chargement…</p>
                </div>
              ) : ordersError ? (
                <div className="py-6 text-center">
                  <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-4">{ordersError}</p>
                  <button
                    type="button"
                    onClick={() => loadOrders({ force: true })}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green text-white text-xs font-bold hover:bg-brand-green-dark transition-colors"
                  >
                    <RefreshCw size={14} />
                    Réessayer
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-6 text-center">
                  <ShoppingBag size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-800">Aucune commande pour l&apos;instant</p>
                  <p className="text-xs text-gray-500 mt-1 mb-4">
                    Découvrez nos produits authentiques du Maroc.
                  </p>
                  <Link
                    to="/catalog"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-orange text-white text-xs font-bold hover:bg-brand-orange-dark transition-colors"
                  >
                    Découvrir le catalogue
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {orders.slice(0, 3).map((order) => (
                    <li
                      key={order.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-brand-cream border border-gray-100"
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-green-light flex items-center justify-center flex-shrink-0">
                        <Package size={16} className="text-brand-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {order.order_number || `CMD-${order.id}`}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {formatDate(order.created_at, true) || 'Date indisponible'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-brand-green">
                          {formatPrice(order.total_amount)}
                        </p>
                        <div className="mt-1">
                          <StatusBadge status={order.status} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="Besoin d'aide ?" description="Notre équipe répond sur WhatsApp">
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => contactSupport('support')}
                  className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl bg-brand-green-light hover:bg-brand-green/10 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <MessageCircle size={18} className="text-brand-green" />
                    <span className="text-sm font-semibold text-brand-green-dark">
                      Contacter le support
                    </span>
                  </span>
                  <ChevronRight size={16} className="text-brand-green" />
                </button>
                <button
                  type="button"
                  onClick={() => contactSupport('help')}
                  className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl bg-brand-cream border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle size={18} className="text-gray-500" />
                    <span className="text-sm font-semibold text-gray-800">Poser une question</span>
                  </span>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
                <p className="text-[11px] text-gray-500 text-center pt-1">
                  WhatsApp {CONTACT_CONFIG.WHATSAPP_PHONE_DISPLAY}
                </p>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-5">
            {orders.length > 0 && (
              <SectionCard
                title="Filtrer mes commandes"
                action={
                  <button
                    type="button"
                    onClick={() => loadOrders({ force: true })}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:text-brand-green-dark"
                  >
                    <RefreshCw size={13} />
                    Actualiser
                  </button>
                }
              >
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {statusFilters.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setSelectedStatus(filter.value)}
                      className={`flex-shrink-0 inline-flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
                        selectedStatus === filter.value
                          ? 'bg-brand-green text-white'
                          : 'bg-brand-cream border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {filter.label}
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedStatus === filter.value
                            ? 'bg-white/25'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </div>
              </SectionCard>
            )}

            {loadingOrders ? (
              <SectionCard>
                <div className="py-10 text-center">
                  <div className="animate-spin rounded-full h-9 w-9 border-2 border-brand-green border-t-transparent mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Chargement de vos commandes…</p>
                </div>
              </SectionCard>
            ) : ordersError ? (
              <SectionCard>
                <div className="py-8 text-center">
                  <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-gray-900 mb-1">Chargement impossible</h3>
                  <p className="text-sm text-gray-600 mb-5">{ordersError}</p>
                  <button
                    type="button"
                    onClick={() => loadOrders({ force: true })}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-colors"
                  >
                    <RefreshCw size={15} />
                    Réessayer
                  </button>
                </div>
              </SectionCard>
            ) : filteredOrders.length === 0 ? (
              <SectionCard>
                <div className="py-8 text-center">
                  <ShoppingBag size={44} className="text-gray-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    {orders.length === 0 ? 'Aucune commande' : 'Aucune commande pour ce filtre'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-5">
                    {orders.length === 0
                      ? 'Vos futures commandes apparaîtront ici avec leur suivi.'
                      : 'Essayez un autre statut pour retrouver vos commandes.'}
                  </p>
                  {orders.length === 0 ? (
                    <Link
                      to="/catalog"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-orange text-white text-sm font-bold hover:bg-brand-orange-dark transition-colors"
                    >
                      <ShoppingBag size={16} />
                      Découvrir nos produits
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('all')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-colors"
                    >
                      Voir toutes mes commandes
                    </button>
                  )}
                </div>
              </SectionCard>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <article
                    key={order.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <div className="p-4 md:p-5 border-b border-gray-100">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900">
                            {order.order_number || `CMD-${order.id}`}
                          </h3>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {formatDate(order.created_at, true) || 'Date indisponible'}
                          </p>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-lg font-bold text-brand-green">
                        {formatPrice(order.total_amount)}
                      </p>
                    </div>

                    {order.items?.length > 0 && (
                      <ul className="divide-y divide-gray-50">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex items-center gap-3 p-4">
                            <div className="w-11 h-11 rounded-xl bg-brand-cream border border-gray-100 flex items-center justify-center flex-shrink-0">
                              <Package size={16} className="text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {item.product_name || 'Produit'}
                              </p>
                              {item.variant_name && (
                                <p className="text-[11px] text-gray-500">{item.variant_name}</p>
                              )}
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {item.quantity || 1} × {formatPrice(item.unit_price)}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                              {formatPrice(item.total_price)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="px-4 py-3 bg-brand-cream border-t border-gray-100 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-gray-500">
                        {order.items_summary?.total_items ?? order.items?.length ?? 0} article
                        {(order.items_summary?.total_items ?? order.items?.length ?? 0) > 1 ? 's' : ''}
                      </p>
                      <a
                        href={generateWhatsAppLink(
                          `Bonjour AfrikRaga ! Je souhaite des informations sur ma commande ${
                            order.order_number || `CMD-${order.id}`
                          }.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:text-brand-green-dark"
                      >
                        <MessageCircle size={13} />
                        Suivre sur WhatsApp
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-5">
            <SectionCard
              title="Informations personnelles"
              description="Votre numéro WhatsApp sert d'identifiant de connexion"
            >
              <div className="space-y-3">
                {editableFields.map(({ field, label, icon: Icon, display, placeholder, note }) => {
                  const isEditing = editingField === field;

                  return (
                    <div
                      key={field}
                      className={`rounded-xl border p-3.5 transition-colors ${
                        isEditing ? 'border-brand-green/30 bg-brand-green-light/40' : 'border-gray-100 bg-brand-cream'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="flex items-center gap-2.5 text-xs font-semibold text-gray-500">
                          <Icon size={16} className="text-gray-400" />
                          {label}
                        </span>
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => startEditing(field)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:text-brand-green-dark"
                          >
                            <Pencil size={13} />
                            Modifier
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-3">
                          {field === 'whatsapp_phone' ? (
                            <PhoneInput
                              id="profile_whatsapp"
                              label=""
                              value={editValue}
                              onChange={(e164) => {
                                setEditValue(e164);
                                setFieldError(null);
                              }}
                              error={fieldError}
                              hint="Ce numéro reçoit les confirmations de commande"
                            />
                          ) : (
                            <div className="space-y-1.5">
                              <input
                                type={field === 'email' ? 'email' : 'text'}
                                value={editValue}
                                onChange={(e) => {
                                  setEditValue(e.target.value);
                                  setFieldError(null);
                                }}
                                placeholder={placeholder}
                                aria-label={label}
                                aria-invalid={Boolean(fieldError)}
                                className={`w-full px-3.5 py-3 bg-white border-2 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green/25 transition-all ${
                                  fieldError
                                    ? 'border-red-300 focus:border-red-400'
                                    : 'border-gray-200 focus:border-brand-green'
                                }`}
                              />
                              {fieldError && (
                                <p className="text-xs text-red-600 flex items-center gap-1.5">
                                  <AlertCircle size={13} className="flex-shrink-0" />
                                  {fieldError}
                                </p>
                              )}
                              {field === 'email' && !fieldError && (
                                <p className="text-[11px] text-gray-500">
                                  Laissez vide pour retirer votre email.
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => saveField(field)}
                              disabled={savingProfile}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-orange text-white text-xs font-bold hover:bg-brand-orange-dark disabled:bg-gray-300 transition-colors"
                            >
                              <Check size={14} />
                              {savingProfile ? 'Enregistrement…' : 'Enregistrer'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              disabled={savingProfile}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
                            >
                              <X size={14} />
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p
                            className={`text-sm font-semibold ${
                              display ? 'text-gray-900' : 'text-gray-400 italic'
                            }`}
                          >
                            {display || 'Non renseigné'}
                          </p>
                          {note && <p className="text-[11px] text-gray-500 mt-1">{note}</p>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Sécurité">
              {passwordOpen ? (
                <form onSubmit={submitPasswordChange} className="space-y-4">
                  <AuthPasswordInput
                    id="current_password"
                    label="Mot de passe actuel"
                    show={passwordVisible}
                    onToggle={() => setPasswordVisible(!passwordVisible)}
                    value={passwordForm.current_password}
                    onChange={(e) => {
                      setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }));
                      setPasswordErrors((prev) => ({ ...prev, current_password: '' }));
                    }}
                    error={passwordErrors.current_password}
                    autoComplete="current-password"
                    placeholder="Votre mot de passe actuel"
                  />
                  <AuthPasswordInput
                    id="new_password"
                    label="Nouveau mot de passe"
                    show={passwordVisible}
                    onToggle={() => setPasswordVisible(!passwordVisible)}
                    value={passwordForm.new_password}
                    onChange={(e) => {
                      setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }));
                      setPasswordErrors((prev) => ({ ...prev, new_password: '' }));
                    }}
                    error={passwordErrors.new_password}
                    autoComplete="new-password"
                    placeholder="Minimum 8 caractères"
                  />
                  <AuthPasswordInput
                    id="new_password_confirmation"
                    label="Confirmer le nouveau mot de passe"
                    show={passwordVisible}
                    onToggle={() => setPasswordVisible(!passwordVisible)}
                    value={passwordForm.new_password_confirmation}
                    onChange={(e) => {
                      setPasswordForm((prev) => ({
                        ...prev,
                        new_password_confirmation: e.target.value,
                      }));
                      setPasswordErrors((prev) => ({ ...prev, new_password_confirmation: '' }));
                    }}
                    error={passwordErrors.new_password_confirmation}
                    autoComplete="new-password"
                    placeholder="Retapez le nouveau mot de passe"
                  />

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="flex-1 py-3 rounded-xl bg-brand-orange text-white text-sm font-bold hover:bg-brand-orange-dark disabled:bg-gray-300 transition-colors"
                    >
                      {savingPassword ? 'Modification…' : 'Modifier le mot de passe'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordOpen(false);
                        setPasswordErrors({});
                        setPasswordForm({
                          current_password: '',
                          new_password: '',
                          new_password_confirmation: '',
                        });
                      }}
                      className="px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setPasswordOpen(true)}
                    className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl bg-brand-green-light hover:bg-brand-green/10 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Shield size={18} className="text-brand-green" />
                      <span className="text-sm font-semibold text-brand-green-dark">
                        Changer mon mot de passe
                      </span>
                    </span>
                    <ChevronRight size={16} className="text-brand-green" />
                  </button>
                  <button
                    type="button"
                    onClick={() => contactSupport('security')}
                    className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl bg-brand-cream border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <MessageCircle size={18} className="text-gray-500" />
                      <span className="text-sm font-semibold text-gray-800">
                        Signaler un problème de sécurité
                      </span>
                    </span>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Session">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <LogOut size={18} className="text-red-600" />
                  <span className="text-sm font-semibold text-red-900">Se déconnecter</span>
                </span>
                <ChevronRight size={16} className="text-red-500" />
              </button>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
