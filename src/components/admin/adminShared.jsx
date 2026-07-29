import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const formatAdminMoney = (n) => {
  const value = Number(n);
  if (!Number.isFinite(value)) return '0 FCFA';
  return `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
};

const BTN_VARIANTS = {
  primary:
    'bg-brand-orange text-white hover:bg-brand-orange-dark shadow-sm shadow-brand-orange/20',
  secondary:
    'bg-brand-green text-white hover:bg-brand-green-dark shadow-sm shadow-brand-green/20',
  outline:
    'bg-white text-brand-green border border-brand-green/30 hover:bg-brand-green-light',
  ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  danger: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
};

export const AdminButton = ({
  children,
  variant = 'primary',
  className = '',
  icon: Icon,
  loading,
  ...props
}) => (
  <button
    type="button"
    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none ${BTN_VARIANTS[variant] || BTN_VARIANTS.primary} ${className}`}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading ? (
      <Loader2 size={16} className="animate-spin" />
    ) : Icon ? (
      <Icon size={16} className="w-4 h-4 flex-shrink-0" />
    ) : null}
    {children}
  </button>
);

export const AdminLinkButton = ({
  children,
  variant = 'primary',
  className = '',
  icon: Icon,
  ...props
}) => (
  <a
    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${BTN_VARIANTS[variant] || BTN_VARIANTS.primary} ${className}`}
    {...props}
  >
    {Icon ? <Icon size={16} /> : null}
    {children}
  </a>
);

export const AdminPanel = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = 'p-4 sm:p-5',
  noPadding,
}) => (
  <div
    className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}
  >
    {(title || action) && (
      <div className="px-4 sm:px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-brand-green-light/40 to-white flex flex-wrap items-center justify-between gap-3">
        <div>
          {title && <h2 className="font-bold text-gray-900 text-sm sm:text-base">{title}</h2>}
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    <div className={noPadding ? bodyClassName.replace(/p-\S+/g, '') : bodyClassName}>{children}</div>
  </div>
);

export const AdminPageHeader = ({ title, description, meta, action, badge }) => (
  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
    <div>
      {(title || badge) && (
        <div className="flex items-center gap-2 flex-wrap">
          {title && <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>}
          {badge}
        </div>
      )}
      {description && (
        <p className={`text-sm text-gray-500 max-w-2xl ${title ? 'mt-1' : ''}`}>{description}</p>
      )}
      {meta && <p className="text-xs text-gray-400 mt-1.5">{meta}</p>}
    </div>
    {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
  </div>
);

const STAT_ACCENTS = {
  green: 'from-brand-green to-brand-green-dark',
  orange: 'from-brand-orange to-brand-orange-dark',
  emerald: 'from-emerald-500 to-emerald-600',
  violet: 'from-violet-500 to-violet-600',
};

export const AdminStatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'green',
  loading,
  trend,
  trendType,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-2/3 mb-4" />
        <div className="h-8 bg-gray-100 rounded w-1/2 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
      </div>
    );
  }

  const gradient = STAT_ACCENTS[accent] || STAT_ACCENTS.green;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-brand-green/10 transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 truncate">{value}</p>
          {hint && <p className="text-xs text-gray-400 mt-1 truncate">{hint}</p>}
          {trend && (
            <p
              className={`text-xs font-medium mt-2 inline-flex px-2 py-0.5 rounded-lg ${
                trendType === 'up'
                  ? 'bg-brand-green-light text-brand-green-dark'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}
          >
            <Icon size={20} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminEmptyState = ({ icon: Icon, title, description, children }) => (
  <div className="flex flex-col items-center justify-center text-center py-10 px-4">
    {Icon && (
      <div className="w-14 h-14 rounded-2xl bg-brand-cream border border-gray-100 flex items-center justify-center mb-3">
        <Icon size={26} className="text-gray-300" />
      </div>
    )}
    <p className="font-semibold text-gray-800">{title}</p>
    {description && <p className="text-sm text-gray-500 mt-1 max-w-xs">{description}</p>}
    {children && <div className="mt-4">{children}</div>}
  </div>
);

export const AdminAlert = ({ type = 'error', title, children, action }) => {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-brand-green-light border-brand-green/20 text-brand-green-dark',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  return (
    <div className={`rounded-2xl border p-4 ${styles[type] || styles.error}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {title && <p className="font-semibold mb-1">{title}</p>}
          <p className="text-sm">{children}</p>
        </div>
        {action}
      </div>
    </div>
  );
};

export const AdminLoadingScreen = ({ label = 'Chargement…' }) => (
  <div className="flex flex-col items-center justify-center py-20">
    <Loader2 size={36} className="animate-spin text-brand-green mb-3" />
    <p className="text-sm text-gray-500">{label}</p>
  </div>
);

export const ORDER_STATUS_CONFIG = {
  en_attente: { label: 'En attente', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  validée: { label: 'Validée', className: 'bg-brand-green-light text-brand-green-dark border-brand-green/20' },
  annulée: { label: 'Annulée', className: 'bg-red-50 text-red-700 border-red-200' },
  pending: { label: 'En attente', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  confirmed: { label: 'Confirmée', className: 'bg-brand-green-light text-brand-green-dark border-brand-green/20' },
  cancelled: { label: 'Annulée', className: 'bg-red-50 text-red-700 border-red-200' },
  processing: { label: 'En cours', className: 'bg-blue-50 text-blue-800 border-blue-200' },
  shipped: { label: 'Expédiée', className: 'bg-blue-50 text-blue-800 border-blue-200' },
  delivered: { label: 'Livrée', className: 'bg-brand-green-light text-brand-green-dark border-brand-green/20' },
};

export const AdminStatusBadge = ({ status }) => {
  const config = ORDER_STATUS_CONFIG[status] || {
    label: status,
    className: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
};

export const AdminQuickAction = ({ to, icon: Icon, title, description, accent = 'green' }) => {
  const accents = {
    green: 'bg-brand-green-light text-brand-green group-hover:bg-brand-green group-hover:text-white',
    orange: 'bg-brand-orange-light text-brand-orange group-hover:bg-brand-orange group-hover:text-white',
    violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white',
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
  };
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-brand-green/20 hover:shadow-md transition-all"
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${accents[accent] || accents.green}`}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-500 truncate">{description}</p>
      </div>
    </Link>
  );
};

export const AdminListRow = ({ icon: Icon, title, subtitle, trailing, badge, onClick }) => {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl bg-brand-cream/50 border border-transparent hover:border-brand-green/15 hover:bg-brand-green-light/30 transition-colors text-left ${onClick ? 'cursor-pointer' : ''}`}
    >
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
          <Icon size={18} className="text-brand-green" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {trailing && <p className="text-sm font-semibold text-gray-900">{trailing}</p>}
        {badge}
      </div>
    </Wrapper>
  );
};
