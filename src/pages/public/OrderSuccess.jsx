import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ShoppingBag,
  MessageCircle,
  Home,
  User,
  Calendar,
  Package,
  Phone,
  ArrowRight,
  CreditCard,
  MapPin,
  Clock,
  Shield,
  Truck,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { generateWhatsAppLink, CONTACT_CONFIG } from '../../config/contact';
import { authService } from '../../services/api';

const formatPrice = (price) => {
  if (price === null || price === undefined || price === '') return '0 FCFA';
  const numPrice = Number(price);
  if (Number.isNaN(numPrice)) return '0 FCFA';
  return `${Math.round(numPrice).toLocaleString('fr-FR')} FCFA`;
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const NEXT_STEPS = [
  {
    step: 1,
    title: 'Commande enregistrée',
    description: 'Votre commande est bien prise en compte par notre équipe.',
    icon: CheckCircle2,
    done: true,
  },
  {
    step: 2,
    title: 'Finaliser le paiement',
    description: 'Orange Money via WhatsApp ou paiement en agence.',
    icon: CreditCard,
    done: false,
    active: true,
  },
  {
    step: 3,
    title: 'Préparation & livraison',
    description: 'Nous vous contactons sur WhatsApp pour organiser la livraison.',
    icon: Truck,
    done: false,
  },
];

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayUser = location.state?.user || user;
  const firstName = displayUser?.name?.split(' ')[0] || 'Client';

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/auth/login');
      return;
    }

    if (location.state?.order) {
      setOrder(location.state.order);
      setIsNewUser(location.state.isNewUser || false);
    } else {
      navigate('/');
    }
  }, [location.state, navigate]);

  const orderNumber = order?.order_number || (order?.id ? `CMD-${String(order.id).padStart(6, '0')}` : '—');
  const orderDate = order?.created_at || order?.summary?.created_at;

  const handleCopyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleWhatsAppPayment = () => {
    let message = `Bonjour ${CONTACT_CONFIG.COMPANY.name} ! Je souhaite finaliser le paiement de ma commande `;
    if (order) {
      message += `${orderNumber} (${order.summary?.total_items || 0} article(s)) pour un total de ${formatPrice(order.total_amount)}.`;
    }
    message += ' Je souhaite payer par Orange Money. Merci de m\'indiquer la marche à suivre.';
    window.open(generateWhatsAppLink(message), '_blank');
  };

  const handleAgencyPayment = () => {
    window.open('https://maps.google.com/?q=12.362822,-1.490340', '_blank');
  };

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-10 text-center">
          <img
            src="/logo-principale.png"
            alt={CONTACT_CONFIG.COMPANY.name}
            className="h-12 w-auto mx-auto mb-6 object-contain"
          />
          <div className="w-10 h-10 rounded-xl bg-brand-green-light flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-green border-t-transparent" />
          </div>
          <p className="text-sm font-medium text-gray-700">Préparation de votre confirmation…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream pb-28 md:pb-12">
      {/* Hero de confirmation — identité AfrikRaga */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-green-dark via-brand-green to-brand-green/90">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden
        />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-orange/20 blur-3xl" aria-hidden />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" aria-hidden />

        <div className="relative max-w-2xl mx-auto px-4 pt-8 pb-10 md:pt-10 md:pb-14 text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-2xl bg-white shadow-lg border border-white/90 px-5 py-3 mb-6 hover:shadow-xl transition-shadow"
          >
            <img
              src="/logo-principale.png"
              alt={CONTACT_CONFIG.COMPANY.name}
              className="h-11 md:h-14 w-auto max-w-[12rem] object-contain"
            />
          </Link>

          <div className="relative inline-flex mb-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 md:w-11 md:h-11 text-white" strokeWidth={2} />
            </div>
            <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-orange flex items-center justify-center shadow-md">
              <Sparkles size={14} className="text-white" />
            </span>
          </div>

          <p className="text-brand-orange-light text-xs font-bold uppercase tracking-[0.2em] mb-2">
            Confirmation de commande
          </p>

          <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2">
            {isNewUser ? (
              <>
                Bienvenue, {firstName}&nbsp;!
                <br />
                <span className="text-white/90 text-xl md:text-2xl font-semibold">
                  Votre commande est enregistrée
                </span>
              </>
            ) : (
              <>
                Merci, {firstName}&nbsp;!
                <br />
                <span className="text-white/90 text-xl md:text-2xl font-semibold">
                  Commande enregistrée avec succès
                </span>
              </>
            )}
          </h1>

          <p className="text-sm md:text-base text-white/75 max-w-md mx-auto leading-relaxed">
            Il ne reste plus qu&apos;à finaliser le paiement. Notre équipe vous accompagne ensuite
            par WhatsApp pour la livraison.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
            <span className="text-[11px] uppercase tracking-wide text-white/60 font-semibold">N° commande</span>
            <span className="text-sm font-bold text-white font-mono tracking-wide">{orderNumber}</span>
            <button
              type="button"
              onClick={handleCopyOrderNumber}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/80"
              aria-label="Copier le numéro de commande"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div className="h-6 bg-brand-cream rounded-t-[2rem] relative -mb-px" aria-hidden />
      </section>

      <div className="max-w-2xl mx-auto px-4 -mt-2 space-y-5 md:space-y-6">
        {/* Reçu commande */}
        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-brand-green-light/30 to-white flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Récapitulatif</h2>
              <p className="text-xs text-gray-500 mt-0.5">{formatDate(orderDate)}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full">
              <Clock size={12} />
              En attente de paiement
            </span>
          </div>

          {order.items?.length > 0 && (
            <ul className="divide-y divide-gray-50 px-5">
              {order.items.map((item, index) => (
                <li key={index} className="py-3.5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-cream border border-gray-100 flex-shrink-0 flex items-center justify-center">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Package size={18} className="text-gray-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-[11px] text-brand-green font-medium mt-0.5">{item.variant_name}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.quantity} × {formatPrice(item.unit_price)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                    {formatPrice(item.total_price ?? item.unit_price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="px-5 py-4 bg-brand-cream/50 border-t border-gray-100 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Package size={14} className="text-brand-green" />
                Articles
              </span>
              <span className="font-medium text-gray-800">
                {order.summary?.total_items || 0} unité{(order.summary?.total_items || 0) > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Truck size={14} className="text-brand-green" />
                Livraison
              </span>
              <span className="font-semibold text-brand-green">Gratuite</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-gray-200/80">
              <span className="text-base font-bold text-gray-900">Total à payer</span>
              <span className="text-xl md:text-2xl font-bold text-brand-green-dark">
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>
          <div className="h-0.5 bg-gradient-to-r from-brand-green via-brand-orange to-brand-green" aria-hidden />
        </article>

        {/* Étapes suivantes */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Prochaines étapes</h2>
            <p className="text-xs text-gray-500 mt-0.5">Suivez l&apos;avancement de votre commande</p>
          </div>
          <ol className="px-5 py-4 space-y-0">
            {NEXT_STEPS.map(({ step, title, description, icon: Icon, done, active }, index) => (
              <li key={step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      done
                        ? 'bg-brand-green text-white'
                        : active
                          ? 'bg-brand-orange text-white ring-4 ring-brand-orange/20'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  {index < NEXT_STEPS.length - 1 && (
                    <div className={`w-0.5 flex-1 min-h-[2rem] my-1 ${done ? 'bg-brand-green/40' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className={`pb-5 ${index === NEXT_STEPS.length - 1 ? 'pb-0' : ''}`}>
                  <p className={`text-sm font-bold ${active ? 'text-brand-orange-dark' : done ? 'text-brand-green-dark' : 'text-gray-400'}`}>
                    {title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Paiement */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 text-center">
            <h2 className="text-base font-bold text-gray-900">Finaliser le paiement</h2>
            <p className="text-xs text-gray-500 mt-0.5">Choisissez l&apos;option qui vous convient</p>
          </div>

          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={handleWhatsAppPayment}
              className="w-full text-left p-4 rounded-xl border-2 border-brand-green/25 bg-gradient-to-br from-brand-green-light/60 to-white hover:border-brand-green/50 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-brand-green flex items-center justify-center flex-shrink-0 shadow-sm">
                  <MessageCircle size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-gray-900">Orange Money via WhatsApp</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-brand-green bg-brand-green-light px-2 py-0.5 rounded-full flex-shrink-0">
                      Recommandé
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Paiement rapide et sécurisé. Notre équipe vous guide pas à pas.
                  </p>
                  <span className="inline-flex items-center gap-1 mt-2.5 text-xs font-bold text-brand-green group-hover:gap-2 transition-all">
                    Contacter sur WhatsApp
                    <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleAgencyPayment}
              className="w-full text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-brand-orange/40 hover:bg-brand-orange-light/20 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-brand-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900">Paiement en agence</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Rendez-vous dans notre agence à {CONTACT_CONFIG.COMPANY.address}.
                  </p>
                  <span className="inline-flex items-center gap-1 mt-2.5 text-xs font-bold text-brand-orange group-hover:gap-2 transition-all">
                    Voir l&apos;emplacement
                    <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Message nouveau client */}
        {isNewUser && (
          <div className="rounded-2xl overflow-hidden border border-brand-green/20 shadow-sm">
            <div className="bg-gradient-to-r from-brand-green to-brand-green-dark px-5 py-5 text-white">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Bienvenue chez {CONTACT_CONFIG.COMPANY.name}</h3>
                  <p className="text-sm text-white/80 mt-1 leading-relaxed">
                    Votre compte est prêt. Finalisez le paiement pour valider votre première commande
                    et profitez d&apos;un suivi personnalisé.
                  </p>
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-2 mt-3 bg-white text-brand-green px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-green-light transition-colors"
                  >
                    Accéder à mon profil
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/catalog"
            className="flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white py-3.5 rounded-xl font-bold text-sm transition-all hover:shadow-md"
          >
            <ShoppingBag size={18} />
            Continuer mes achats
          </Link>
          <Link
            to="/profile"
            className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 hover:border-brand-green hover:text-brand-green py-3.5 rounded-xl font-bold text-sm transition-all"
          >
            <User size={18} />
            Mon profil
          </Link>
        </div>

        {/* Support */}
        <footer className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Shield size={16} className="text-brand-green" />
            <h3 className="text-sm font-bold text-gray-900">Besoin d&apos;aide ?</h3>
          </div>
          <div className="p-4 space-y-2">
            <a
              href={generateWhatsAppLink(`Bonjour, j'ai une question sur ma commande ${orderNumber}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-brand-green-light/40 hover:bg-brand-green-light/70 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle size={16} className="text-brand-green" />
                <span className="text-sm text-gray-700">WhatsApp — 24h/24</span>
              </div>
              <ArrowRight size={14} className="text-brand-green opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600">Téléphone</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{CONTACT_CONFIG.WHATSAPP_PHONE_DISPLAY}</span>
            </div>
          </div>
          <div className="px-5 py-3 bg-brand-cream/60 border-t border-gray-100 flex items-center justify-between gap-3">
            <img
              src="/logo-header.png"
              alt={CONTACT_CONFIG.COMPANY.name}
              className="h-7 w-auto object-contain opacity-80"
            />
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green hover:text-brand-green-dark transition-colors"
            >
              <Home size={14} />
              Retour à l&apos;accueil
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default OrderSuccess;
