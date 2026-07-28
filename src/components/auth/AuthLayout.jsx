import { Link } from 'react-router-dom';
import { ChevronLeft, Shield, Truck, MessageCircle, Sparkles, Lock, Eye, EyeOff } from 'lucide-react';
import { CONTACT_CONFIG } from '../../config/contact';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=900&h=1200&fit=crop&q=80';

const TRUST_ITEMS = [
  { icon: Shield, text: 'Compte sécurisé' },
  { icon: Truck, text: 'Livraison gratuite' },
  { icon: MessageCircle, text: 'Support WhatsApp' },
];

export const AuthInput = ({
  label,
  icon: Icon,
  error,
  optional = false,
  hint,
  id,
  className = '',
  ...inputProps
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
      {label}
      {optional && <span className="text-gray-400 font-normal ml-1">(optionnel)</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Icon size={18} className="text-gray-400" />
        </div>
      )}
      <input
        id={id}
        className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3.5 bg-brand-cream/60 border-2 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/25 transition-all ${
          error
            ? 'border-red-300 focus:border-red-400'
            : 'border-gray-200 focus:border-brand-green'
        } ${className}`}
        {...inputProps}
      />
    </div>
    {hint && !error && <p className="text-[11px] text-gray-400">{hint}</p>}
    {error && (
      <p className="text-xs text-red-600 flex items-center gap-1.5">
        <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);

export const AuthPasswordInput = ({
  label,
  show,
  onToggle,
  error,
  id,
  ...inputProps
}) => (
  <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Lock size={18} className="text-gray-400" />
        </div>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className={`w-full pl-11 pr-11 py-3.5 bg-brand-cream/60 border-2 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/25 transition-all ${
            error
              ? 'border-red-300 focus:border-red-400'
              : 'border-gray-200 focus:border-brand-green'
          }`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
          {error}
        </p>
      )}
  </div>
);

export const AuthAlert = ({ type = 'error', title, message, hint, action }) => {
  const styles =
    type === 'error'
      ? 'bg-red-50 border-red-100 text-red-800'
      : type === 'warning'
        ? 'bg-amber-50 border-amber-100 text-amber-900'
        : 'bg-brand-green-light border-brand-green/20 text-brand-green-dark';

  return (
    <div className={`p-4 rounded-xl border ${styles}`}>
      {title && <p className="text-sm font-semibold">{title}</p>}
      {message && <p className={`text-sm ${title ? 'mt-1' : ''}`}>{message}</p>}
      {hint && <p className="text-xs mt-2 opacity-90 leading-relaxed">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
};

export const AuthSubmitButton = ({ loading, loadingText, children, disabled }) => (
  <button
    type="submit"
    disabled={disabled || loading}
    className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white py-3.5 rounded-xl font-bold text-sm md:text-base transition-all hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  >
    {loading ? (
      <>
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
        <span>{loadingText || 'Chargement…'}</span>
      </>
    ) : (
      children
    )}
  </button>
);

export const AuthDivider = ({ label = 'ou' }) => (
  <div className="relative my-5">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-200" />
    </div>
    <div className="relative flex justify-center">
      <span className="px-3 bg-white text-xs text-gray-400 font-semibold uppercase tracking-wide">
        {label}
      </span>
    </div>
  </div>
);

const AuthLogo = ({ size = 'md', className = '' }) => {
  const heights = { sm: 'h-9', md: 'h-12', lg: 'h-14', xl: 'h-16' };
  return (
    <Link
      to="/"
      className={`inline-flex items-center justify-center rounded-2xl bg-white shadow-md border border-white/90 px-4 py-2.5 hover:shadow-lg transition-shadow ${className}`}
    >
      <img
        src="/logo-principale.png"
        alt={CONTACT_CONFIG.COMPANY.name}
        className={`${heights[size] || heights.md} w-auto max-w-[11rem] object-contain`}
      />
    </Link>
  );
};

const AuthHeroPanel = ({ badge }) => (
  <div className="relative hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between overflow-hidden bg-brand-green-dark">
    <img
      src={HERO_IMAGE}
      alt="Épices et produits authentiques du Maroc"
      className="absolute inset-0 w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-br from-brand-green/95 via-brand-green/85 to-brand-green-dark/90" />

    <div className="relative z-10 p-8 xl:p-10">
      <AuthLogo size="xl" />
    </div>

    <div className="relative z-10 p-8 xl:p-10 flex-1 flex flex-col justify-center">
      {badge && (
        <span className="inline-flex items-center gap-1.5 w-fit bg-white/15 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full mb-5 border border-white/20">
          <Sparkles size={12} />
          {badge}
        </span>
      )}
      <h2 className="text-2xl xl:text-3xl font-bold text-white leading-snug mb-3">
        Les trésors du Maroc,
        <br />
        <span className="text-brand-orange-light">livré chez vous</span>
      </h2>
      <p className="text-sm text-white/80 leading-relaxed max-w-sm">
        Rejoignez la communauté {CONTACT_CONFIG.COMPANY.name} et commandez en toute confiance
        des produits authentiques, avec un suivi WhatsApp personnalisé.
      </p>

      <ul className="mt-8 space-y-3">
        {TRUST_ITEMS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-sm text-white/90">
            <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <Icon size={16} className="text-brand-orange-light" />
            </span>
            {text}
          </li>
        ))}
      </ul>
    </div>

    <div className="relative z-10 p-8 xl:p-10">
      <p className="text-xs text-white/50">
        © {new Date().getFullYear()} {CONTACT_CONFIG.COMPANY.name} · {CONTACT_CONFIG.COMPANY.address}
      </p>
    </div>
  </div>
);

const AuthLayout = ({
  title,
  subtitle,
  backTo = '/',
  backLabel = 'Retour',
  badge,
  children,
  footer,
  topBanner,
  legalNote,
}) => (
  <div className="min-h-screen bg-brand-cream flex flex-col lg:flex-row">
    <AuthHeroPanel badge={badge} />

    <div className="flex-1 flex flex-col min-h-screen">
      {/* Mobile hero strip */}
      <div className="lg:hidden relative min-h-[11rem] sm:min-h-[12.5rem] overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-green/92 via-brand-green/88 to-brand-green-dark/90" />
        <div className="relative z-10 h-full flex flex-col p-4">
          <Link
            to={backTo}
            className="inline-flex items-center gap-1 w-fit px-2.5 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm text-white text-xs font-semibold border border-white/20"
          >
            <ChevronLeft size={16} />
            {backLabel}
          </Link>

          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-3">
            <AuthLogo size="lg" />
            {badge && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-white bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full border border-white/25">
                <Sparkles size={11} />
                {badge}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start lg:items-center justify-center px-4 py-6 lg:py-10 lg:px-8 xl:px-12">
        <div className="w-full max-w-md">
          <Link
            to={backTo}
            className="hidden lg:inline-flex items-center gap-1 text-sm font-semibold text-brand-green hover:text-brand-green-dark mb-6 transition-colors"
          >
            <ChevronLeft size={18} />
            {backLabel}
          </Link>

          <div className="hidden lg:block mb-6">
            <img
              src="/logo-header.png"
              alt={CONTACT_CONFIG.COMPANY.name}
              className="h-12 object-contain mb-4"
            />
          </div>

          <div className="mb-5 lg:mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{subtitle}</p>
            )}
          </div>

          {topBanner}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 md:p-6">{children}</div>
            <div className="h-0.5 bg-gradient-to-r from-brand-green via-brand-orange to-brand-green" aria-hidden />
          </div>

          {footer && <div className="mt-5 text-center text-sm text-gray-500">{footer}</div>}

          {(legalNote !== null) && (
            <p className="mt-6 text-center text-[11px] text-gray-400 leading-relaxed px-2">
              {legalNote ?? (
                <>
                  En continuant, vous acceptez nos conditions d&apos;utilisation.
                  <br />
                  Vos données sont protégées · Support {CONTACT_CONFIG.WHATSAPP_PHONE_DISPLAY}
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default AuthLayout;
