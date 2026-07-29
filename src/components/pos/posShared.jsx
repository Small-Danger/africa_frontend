import { useState } from 'react';
import { Package, Loader2 } from 'lucide-react';
import { PAYMENT_METHODS } from '../../services/posApi';

export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop';

export const formatPosMoney = (n) => {
  const value = Number(n);
  if (!Number.isFinite(value)) return '0 FCFA';
  return `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
};

export const methodLabel = (method) =>
  PAYMENT_METHODS.find((m) => m.value === method)?.label || method;

export const PAYMENT_METHOD_CONFIG = {
  especes: {
    label: 'Espèces',
    icon: '💵',
    active: 'bg-brand-green-light border-brand-green text-brand-green-dark',
  },
  carte: {
    label: 'Carte',
    icon: '💳',
    active: 'bg-blue-50 border-blue-400 text-blue-800',
  },
  orange_money: {
    label: 'Orange Money',
    icon: '🟠',
    active: 'bg-brand-orange-light border-brand-orange text-brand-orange-dark',
  },
  wave: {
    label: 'Wave',
    icon: '🌊',
    active: 'bg-violet-50 border-violet-400 text-violet-800',
  },
};

export const PosProductThumb = ({ src, alt, size = 'md', className = '' }) => {
  const [failed, setFailed] = useState(false);
  const sizes = {
    sm: 'w-10 h-10 rounded-lg',
    md: 'w-12 h-12 rounded-xl',
    lg: 'w-14 h-14 rounded-xl',
    xl: 'w-16 h-16 rounded-2xl',
  };
  const iconSizes = { sm: 14, md: 18, lg: 20, xl: 22 };
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
        <Package size={iconSizes[size] || 18} className="text-gray-300" />
      )}
    </div>
  );
};

export const PosPanel = ({ title, subtitle, step, children, className = '', headerClassName = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col ${className}`}>
    {(title || subtitle) && (
      <div className={`px-4 lg:px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-brand-green-light/30 to-white ${headerClassName}`}>
        <div className="flex items-center gap-3">
          {step != null && (
            <div className="w-8 h-8 rounded-xl bg-brand-green flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-sm font-bold text-white">{step}</span>
            </div>
          )}
          <div>
            {title && <h2 className="font-bold text-gray-900 text-sm md:text-base">{title}</h2>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
    )}
    {children}
  </div>
);

export const PosPageHeader = ({ title, description, action }) => (
  <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h1>
      {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
    </div>
    {action}
  </div>
);

export const PosEmptyState = ({ icon: Icon = Package, title, description, children }) => (
  <div className="flex flex-col items-center justify-center text-center py-12 px-4">
    <div className="w-16 h-16 rounded-2xl bg-brand-cream border border-gray-100 flex items-center justify-center mb-4">
      <Icon size={28} className="text-gray-300" />
    </div>
    <p className="text-base font-bold text-gray-800 mb-1">{title}</p>
    {description && <p className="text-sm text-gray-500 max-w-xs mb-5">{description}</p>}
    {children}
  </div>
);

export const PosAlert = ({ type = 'error', children }) => {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-brand-green-light border-brand-green/20 text-brand-green-dark',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  return (
    <p className={`text-sm rounded-xl px-3 py-2.5 border ${styles[type] || styles.error}`}>{children}</p>
  );
};

export const PosButton = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) => {
  const variants = {
    primary:
      'bg-brand-orange hover:bg-brand-orange-dark text-white shadow-md shadow-brand-orange/20 disabled:bg-gray-300 disabled:shadow-none',
    secondary:
      'bg-white border-2 border-gray-200 text-gray-700 hover:border-brand-green hover:text-brand-green disabled:opacity-50',
    danger: 'bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-300',
    ghost: 'bg-brand-green-light/60 text-brand-green-dark hover:bg-brand-green-light disabled:opacity-50',
    dark: 'bg-brand-green-dark hover:bg-brand-green text-white disabled:bg-gray-400',
  };
  const sizes = {
    sm: 'px-3 py-2 text-xs rounded-xl',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-5 py-3.5 text-base rounded-2xl',
    xl: 'w-full py-4 text-lg rounded-2xl',
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-bold transition-all disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={size === 'lg' || size === 'xl' ? 20 : 16} className="animate-spin" />}
      {children}
    </button>
  );
};

export const PosLoadingScreen = ({ message = 'Chargement…' }) => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <div className="w-11 h-11 rounded-xl bg-brand-green-light flex items-center justify-center">
      <Loader2 size={22} className="text-brand-green animate-spin" />
    </div>
    <p className="text-sm text-gray-600">{message}</p>
  </div>
);
