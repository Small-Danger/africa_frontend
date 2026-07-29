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
  Heart,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { orderService, authService, productService } from '../../services/api';
import { generateWhatsAppLink, CONTACT_CONFIG } from '../../config/contact';
import { formatPhoneE164Display, sanitizePhoneE164, getPhoneValidationResult } from '../../utils/phone';
import { parseAuthFormError } from '../../utils/authErrors';
import PhoneInput from '../../components/forms/PhoneInput';
import { AuthPasswordInput } from '../../components/auth/AuthLayout';
import useFavorites from '../../hooks/useFavorites';
import ProductCard from '../../components/ProductCard';

const SESSION_CACHE_KEY = 'afrikraga_user_orders_cache';
const SESSION_CACHE_TTL = 30 * 1000;

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop';

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

/** Adapte un produit détail API pour ProductCard */
const normalizeProductForCard = (product) => {
  const variants = product?.variants ?? [];
  const prices = variants.map((v) => Number(v.price)).filter((p) => !Number.isNaN(p));
  const minFromVariants = prices.length ? Math.min(...prices) : null;

  return {
    ...product,
    min_price: product.min_price ?? minFromVariants ?? product.base_price,
    min_price_label: product.min_price_label ?? variants.sort((a, b) => Number(a.price) - Number(b.price))[0]?.name,
    variants_count: product.variants_count ?? variants.length,
    has_variants: product.has_variants ?? variants.length > 1,
  };
};

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

const SectionCard = ({ title, description, children, action, className = '' }) => (
  <section className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
    {(title || action) && (
      <div className="flex items-start justify-between gap-3 px-5 md:px-6 pt-5 md:pt-6 pb-4 border-b border-gray-50">
        <div>
          {title && <h3 className="text-base font-bold text-gray-900">{title}</h3>}
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
    )}
    <div className={title || action ? 'p-5 md:p-6' : 'p-5 md:p-6'}>{children}</div>
  </section>
);

/** Miniature produit avec repli sur icône */
const ProductThumb = ({ src, alt, size = 'md', className = '' }) => {
  const [failed, setFailed] = useState(false);
  const sizes = {
    sm: 'w-10 h-10 rounded-xl',
    md: 'w-11 h-11 rounded-xl',
    lg: 'w-14 h-14 rounded-xl',
    xl: 'w-16 h-16 rounded-2xl',
  };

  const showImage = src && !failed;

  return (
    <div
      className={`${sizes[size] || sizes.md} flex-shrink-0 overflow-hidden bg-brand-cream border border-gray-100 flex items-center justify-center ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || 'Produit'}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <Package size={size === 'sm' ? 14 : size === 'lg' || size === 'xl' ? 20 : 16} className="text-gray-300" />
      )}
    </div>
  );
};

/** Aperçu empilé pour le récapitulatif commande (overview) */
const OrderPreviewStack = ({ items = [] }) => {
  const withImages = items.filter(Boolean);
  const first = withImages[0];
  const extra = withImages.length - 1;

  if (!first) {
    return <ProductThumb size="lg" alt="Commande" />;
  }

  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <ProductThumb
        src={first.product_image}
        alt={first.product_name}
        size="lg"
        className="absolute inset-0 shadow-sm ring-2 ring-white"
      />
      {withImages[1] && (
        <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-lg overflow-hidden border-2 border-white shadow-sm bg-brand-cream">
          <img
            src={withImages[1].product_image || PLACEHOLDER_IMAGE}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      {extra > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[1.15rem] h-[1.15rem] px-0.5 rounded-full bg-brand-orange text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
          +{extra}
        </span>
      )}
    </div>
  );
};

/** Ligne article dans une commande */
const OrderItemRow = ({ item }) => {
  const productLink = item.product_id ? `/products/${item.product_id}` : null;
  const nameEl = (
    <p className="text-sm font-semibold text-gray-900 truncate">
      {item.product_name || 'Produit'}
    </p>
  );

  return (
    <li className="flex items-center gap-3 p-4 hover:bg-brand-cream/40 transition-colors">
      {productLink ? (
        <Link to={productLink} className="flex-shrink-0">
          <ProductThumb src={item.product_image} alt={item.product_name} size="md" />
        </Link>
      ) : (
        <ProductThumb src={item.product_image} alt={item.product_name} size="md" />
      )}
      <div className="flex-1 min-w-0">
        {productLink ? (
          <Link to={productLink} className="hover:text-brand-green transition-colors">
            {nameEl}
          </Link>
        ) : (
          nameEl
        )}
        {item.variant_name && (
          <p className="text-[11px] text-brand-green font-medium mt-0.5">{item.variant_name}</p>
        )}
        <p className="text-[11px] text-gray-500 mt-0.5">
          {item.quantity || 1} × {formatPrice(item.unit_price ?? item.price)}
        </p>
      </div>
      <p className="text-sm font-bold text-gray-900 flex-shrink-0">
        {formatPrice(item.total_price)}
      </p>
    </li>
  );
};

/** Carte commande compacte (overview) */
const OrderCompactRow = ({ order, onClickOrders }) => (
  <li>
    <button
      type="button"
      onClick={onClickOrders}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-brand-cream/80 border border-gray-100 hover:border-brand-green/25 hover:bg-brand-green-light/30 transition-all text-left group"
    >
      <OrderPreviewStack items={order.items} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-brand-green-dark transition-colors">
          {order.order_number || `CMD-${order.id}`}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5">
          {formatDate(order.created_at, true) || 'Date indisponible'}
          {(order.items_summary?.total_items ?? order.items?.length) > 0 && (
            <span className="text-gray-400">
              {' '}
              · {order.items_summary?.total_items ?? order.items?.length} art.
            </span>
          )}
        </p>
      </div>
      <div className="text-right flex-shrink-0 space-y-1">
        <p className="text-sm font-bold text-brand-green">{formatPrice(order.total_amount)}</p>
        <StatusBadge status={order.status} />
      </div>
    </button>
  </li>
);

/** Carte commande complète (onglet commandes) */
const OrderCard = ({ order }) => {
  const itemCount = order.items_summary?.total_items ?? order.items?.length ?? 0;

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 md:p-5 border-b border-gray-100 bg-gradient-to-r from-brand-green-light/20 to-white">
        <div className="flex items-start gap-3">
          <OrderPreviewStack items={order.items} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 truncate">
                  {order.order_number || `CMD-${order.id}`}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {formatDate(order.created_at, true) || 'Date indisponible'}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-lg font-bold text-brand-green mt-2">{formatPrice(order.total_amount)}</p>
          </div>
        </div>
      </div>

      {order.items?.length > 0 && (
        <ul className="divide-y divide-gray-50">
          {order.items.map((item) => (
            <OrderItemRow key={item.id ?? `${item.product_id}-${item.variant_name}`} item={item} />
          ))}
        </ul>
      )}

      <div className="px-4 py-3 bg-brand-cream/60 border-t border-gray-100 flex items-center justify-between gap-3">
        <p className="text-[11px] text-gray-500">
          {itemCount} article{itemCount > 1 ? 's' : ''}
        </p>
        <a
          href={generateWhatsAppLink(
            `Bonjour AfrikRaga ! Je souhaite des informations sur ma commande ${
              order.order_number || `CMD-${order.id}`
            }.`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:text-brand-green-dark transition-colors"
        >
          <MessageCircle size={13} />
          Suivre sur WhatsApp
        </a>
      </div>
      <div className="h-0.5 bg-gradient-to-r from-brand-green via-brand-orange to-brand-green" aria-hidden />
    </article>
  );
};

const UserProfile = () => {
  const { user, logout, updateUser, refreshUser } = useAuth();
  const { showSuccess } = useNotification();
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [favoritesError, setFavoritesError] = useState(null);
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

  const loadFavorites = useCallback(async () => {
    if (!favorites.length) {
      setFavoriteProducts([]);
      setLoadingFavorites(false);
      return;
    }

    setLoadingFavorites(true);
    setFavoritesError(null);

    try {
      const results = await Promise.allSettled(
        favorites.map((id) => productService.getProduct(id))
      );

      const products = results
        .filter((result) => result.status === 'fulfilled' && result.value?.success && result.value.data)
        .map((result) => normalizeProductForCard(result.value.data));

      setFavoriteProducts(products);
    } catch {
      setFavoritesError('Impossible de charger vos favoris.');
      setFavoriteProducts([]);
    } finally {
      setLoadingFavorites(false);
    }
  }, [favorites]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/auth/login', { replace: true });
      return;
    }
    loadOrders();
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, loadOrders]);

  useEffect(() => {
    if (activeTab === 'favorites' || activeTab === 'overview') {
      loadFavorites();
    }
  }, [activeTab, loadFavorites]);

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
    { id: 'favorites', label: 'Favoris', icon: Heart, badge: favorites.length },
    { id: 'orders', label: 'Commandes', icon: ShoppingBag, badge: stats.totalOrders },
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
      <header className="relative overflow-hidden bg-gradient-to-br from-brand-green-dark via-brand-green to-brand-green/95 text-white">
        <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-brand-orange/15 blur-3xl" aria-hidden />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" aria-hidden />

        <div className="relative max-w-5xl mx-auto px-4 pt-5 pb-10">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/"
              className="inline-flex items-center rounded-xl bg-white/95 shadow-md border border-white/90 px-3 py-2 hover:shadow-lg transition-shadow"
            >
              <img
                src="/logo-principale.png"
                alt={CONTACT_CONFIG.COMPANY.name}
                className="h-8 md:h-9 w-auto max-w-[7.5rem] object-contain"
              />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-semibold transition-colors border border-white/10"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-2xl bg-white/15 border-2 border-white/25 flex items-center justify-center text-xl font-bold shadow-inner">
                {getInitials(user.name)}
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-orange flex items-center justify-center border-2 border-brand-green shadow-sm">
                <Sparkles size={11} className="text-white" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-brand-orange-light text-[10px] font-bold uppercase tracking-[0.15em] mb-0.5">
                Mon espace client
              </p>
              <h1 className="text-xl md:text-2xl font-bold truncate">{user.name}</h1>
              <p className="text-white/85 text-sm font-medium truncate mt-0.5">
                {user.whatsapp_phone ? formatPhoneE164Display(user.whatsapp_phone) : 'Numéro non renseigné'}
              </p>
              <p className="text-white/55 text-xs mt-0.5">
                {memberSince ? `Membre depuis ${memberSince}` : 'Bienvenue chez AfrikRaga'}
              </p>
            </div>
          </div>
        </div>

        <div className="h-5 bg-brand-cream rounded-t-[1.75rem] relative -mb-px" aria-hidden />
      </header>

      <div className="max-w-5xl mx-auto px-4 -mt-1">
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-green-light flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={18} className="text-brand-green" />
            </div>
            <div>
              <div className="text-xl font-bold text-brand-green leading-none">{stats.totalOrders}</div>
              <div className="text-[11px] text-gray-500 mt-1">
                Commande{stats.totalOrders > 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-orange-light flex items-center justify-center flex-shrink-0">
              <Wallet size={18} className="text-brand-orange" />
            </div>
            <div className="min-w-0">
              <div className="text-base md:text-lg font-bold text-brand-orange-dark leading-tight truncate">
                {formatPrice(stats.totalSpent)}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">Total dépensé</div>
            </div>
          </div>
        </div>

        <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 mb-5 flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id}
              className={`flex-shrink-0 flex-1 min-w-[4.5rem] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
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
                  className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-brand-green/15 bg-gradient-to-br from-brand-green-light/80 to-white hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
                    <ShoppingBag size={20} className="text-brand-green" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-brand-green-dark text-center">
                    Continuer mes achats
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveTab('favorites')}
                  className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-red-100 bg-gradient-to-br from-red-50 to-white hover:shadow-md transition-all relative"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <Heart size={20} className="text-red-500" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-red-700 text-center">
                    Mes favoris
                  </span>
                  {favorites.length > 0 && (
                    <span className="absolute top-2 right-2 min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {favorites.length}
                    </span>
                  )}
                </button>
                <Link
                  to="/cart"
                  className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-brand-orange/20 bg-gradient-to-br from-brand-orange-light/80 to-white hover:shadow-md transition-all col-span-2 sm:col-span-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                    <Package size={20} className="text-brand-orange-dark" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-brand-orange-dark text-center">
                    Voir mon panier
                  </span>
                </Link>
              </div>
            </SectionCard>

            {favoriteProducts.length > 0 && (
              <SectionCard
                title="Mes favoris"
                description="Produits enregistrés sur cet appareil"
                action={
                  <button
                    type="button"
                    onClick={() => setActiveTab('favorites')}
                    className="text-xs font-bold text-brand-green hover:text-brand-green-dark whitespace-nowrap"
                  >
                    Voir tout ({favoriteProducts.length})
                  </button>
                }
              >
                <div className="grid grid-cols-2 gap-3">
                  {favoriteProducts.slice(0, 2).map((product) => (
                    <ProductCard key={product.id} product={product} showActions />
                  ))}
                </div>
              </SectionCard>
            )}

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
                    <OrderCompactRow
                      key={order.id}
                      order={order}
                      onClickOrders={() => setActiveTab('orders')}
                    />
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

        {activeTab === 'favorites' && (
          <div className="space-y-5">
            <SectionCard
              title="Mes produits favoris"
              description="Enregistrés sur cet appareil — ajoutez-en depuis le catalogue avec le cœur"
              action={
                favoriteProducts.length > 0 ? (
                  <button
                    type="button"
                    onClick={loadFavorites}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:text-brand-green-dark"
                  >
                    <RefreshCw size={13} />
                    Actualiser
                  </button>
                ) : null
              }
            >
              {loadingFavorites ? (
                <div className="py-10 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-green border-t-transparent mx-auto mb-3" />
                  <p className="text-xs text-gray-500">Chargement de vos favoris…</p>
                </div>
              ) : favoritesError ? (
                <div className="py-6 text-center">
                  <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-4">{favoritesError}</p>
                  <button
                    type="button"
                    onClick={loadFavorites}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green text-white text-xs font-bold"
                  >
                    <RefreshCw size={14} />
                    Réessayer
                  </button>
                </div>
              ) : favoriteProducts.length === 0 ? (
                <div className="py-8 text-center">
                  <Heart size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-800">Aucun favori pour l&apos;instant</p>
                  <p className="text-xs text-gray-500 mt-1 mb-5 max-w-xs mx-auto">
                    Appuyez sur le cœur sur un produit pour le retrouver ici plus tard.
                  </p>
                  <Link
                    to="/catalog"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-orange text-white text-xs font-bold hover:bg-brand-orange-dark transition-colors"
                  >
                    Explorer le catalogue
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {favoriteProducts.map((product) => (
                    <ProductCard key={product.id} product={product} showActions />
                  ))}
                </div>
              )}
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
                  <OrderCard key={order.id} order={order} />
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
