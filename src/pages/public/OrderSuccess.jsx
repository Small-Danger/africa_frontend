import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  ShoppingBag, 
  MessageCircle, 
  Home, 
  User,
  Calendar,
  Package,
  Phone,
  ArrowRight,
  Star,
  CreditCard,
  MapPin,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { generateWhatsAppLink, CONTACT_CONFIG } from '../../config/contact';
import { authService } from '../../services/api';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    console.log('🎯 OrderSuccess - location.state:', location.state);
    console.log('🎯 OrderSuccess - user:', user);
    
    // Vérifier que l'utilisateur est connecté
    if (!authService.isAuthenticated()) {
      console.log('❌ Utilisateur non connecté, redirection vers login');
      navigate('/auth/login');
      return;
    }

    if (location.state?.order) {
      console.log('✅ Données de commande reçues:', location.state.order);
      setOrder(location.state.order);
      setIsNewUser(location.state.isNewUser || false);
    } else {
      console.log('❌ Pas de données de commande, redirection vers accueil');
      // Si pas de données de commande, rediriger vers l'accueil
      navigate('/');
    }
  }, [location.state, navigate, user]);

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === '') return '0 FCFA';
    const numPrice = Number(price);
    if (isNaN(numPrice)) return '0 FCFA';
    return `${Math.round(numPrice)} FCFA`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleWhatsAppPayment = () => {
    let message = `Bonjour ! Je souhaite finaliser le paiement de ma commande `;
    if (order) {
      message += `(${order.order_number}) de ${order.summary?.total_items || 0} article(s) pour un total de ${formatPrice(order.total_amount)} FCFA.`;
    }
    message += ` Je souhaite payer par Orange Money. Pouvez-vous m'aider ?`;
    
    const whatsappUrl = generateWhatsAppLink(message);
    window.open(whatsappUrl, '_blank');
  };

  const handleAgencyPayment = () => {
    const agencyUrl = 'https://maps.google.com/?q=12.362822,-1.490340';
    window.open(agencyUrl, '_blank');
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream pb-24 md:pb-8">
      {/* Header - Optimisé mobile */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Commande en attente</h1>
          <Link to="/" className="text-brand-green hover:text-brand-green-dark transition-colors">
            <Home size={18} className="sm:w-5 sm:h-5" />
          </Link>
        </div>
      </div>

      {/* Contenu principal - Optimisé mobile */}
      <div className="px-3 sm:px-4 py-4 sm:py-8">
        {/* Animation de succès - Optimisée mobile */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="relative inline-block">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-brand-orange rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 animate-pulse">
              <Clock size={32} className="sm:w-12 sm:h-12 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <AlertCircle size={12} className="sm:w-4 sm:h-4 text-white" />
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {isNewUser ? 'Bienvenue ! Finalisez votre commande' : 'Commande en attente de paiement'}
          </h2>
          <p className="text-gray-600 text-base sm:text-lg px-2">
            Votre commande est bien enregistrée, il ne reste plus qu'à effectuer le paiement pour finaliser.
          </p>
        </div>

        {/* Carte de confirmation - Optimisée mobile */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="text-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-brand-green-light rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Package size={24} className="sm:w-8 sm:h-8 text-brand-green" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Détails de la commande</h3>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <ShoppingBag size={16} className="sm:w-5 sm:h-5 text-gray-500" />
                <span className="text-sm sm:text-base text-gray-600">Numéro</span>
              </div>
              <span className="font-bold text-sm sm:text-base text-gray-900">
                {order.order_number || `CMD-${order.id}`}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Calendar size={16} className="sm:w-5 sm:h-5 text-gray-500" />
                <span className="text-sm sm:text-base text-gray-600">Date</span>
              </div>
              <span className="font-medium text-sm sm:text-base text-gray-900">
                {order.created_at ? formatDate(order.created_at) : 'Date non disponible'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Package size={16} className="sm:w-5 sm:h-5 text-gray-500" />
                <span className="text-sm sm:text-base text-gray-600">Articles</span>
              </div>
              <span className="font-medium text-sm sm:text-base text-gray-900">
                {order.summary?.total_items || 0} article(s)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-brand-orange-light rounded-lg sm:rounded-xl border border-brand-orange/30">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <CreditCard size={16} className="sm:w-5 sm:h-5 text-brand-orange" />
                <span className="text-brand-orange-dark font-medium text-sm sm:text-base">À payer</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-brand-green-dark">{formatPrice(order.total_amount)} FCFA</span>
            </div>
          </div>
        </div>

        {/* Options de paiement - Optimisées mobile */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 text-center">Choisissez votre mode de paiement</h3>
          
          <div className="space-y-3 sm:space-y-4">
            {/* Option 1: Orange Money via WhatsApp */}
            <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-brand-green-light rounded-lg sm:rounded-xl border border-brand-green/20">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-green/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <MessageCircle size={16} className="sm:w-5 sm:h-5 text-brand-green" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Paiement Orange Money</h4>
                <p className="text-gray-600 text-xs sm:text-sm mb-2">Payez rapidement via WhatsApp avec Orange Money</p>
                <button
                  onClick={handleWhatsAppPayment}
                  className="bg-brand-green text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-brand-green-dark transition-colors"
                >
                  Payer maintenant
                </button>
              </div>
            </div>

            {/* Option 2: Paiement en agence */}
            <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-brand-orange-light rounded-lg sm:rounded-xl border border-brand-orange/20">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-orange/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <MapPin size={16} className="sm:w-5 sm:h-5 text-brand-orange" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Paiement en agence</h4>
                <p className="text-gray-600 text-xs sm:text-sm mb-2">Rendez-vous dans notre agence pour payer</p>
                <button
                  onClick={handleAgencyPayment}
                  className="bg-brand-orange text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-brand-orange-dark transition-colors flex items-center space-x-1"
                >
                  <MapPin size={12} className="sm:w-4 sm:h-4" />
                  <span>Voir l'agence</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides - Optimisées mobile */}
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Link
              to="/catalog"
              className="bg-brand-orange text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold hover:bg-brand-orange-dark transition-colors flex items-center justify-center space-x-2"
            >
              <ShoppingBag size={18} className="sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Continuer mes achats</span>
            </Link>

            <Link
              to="/profile"
              className="bg-gray-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
            >
              <User size={18} className="sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Mon profil</span>
            </Link>
          </div>
        </div>

        {/* Message de bienvenue pour nouveaux utilisateurs - Optimisé mobile */}
        {isNewUser && (
          <div className="mt-6 sm:mt-8 bg-gradient-to-r from-brand-green to-brand-green-dark rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white text-center">
            <h3 className="text-lg sm:text-xl font-bold mb-2">🎉 Bienvenue chez AfrikRaga !</h3>
            <p className="text-white/80 mb-4 text-sm sm:text-base">
              Votre compte a été créé avec succès. Finalisez votre paiement pour valider votre première commande.
            </p>
            <Link
              to="/profile"
              className="inline-flex items-center bg-white text-brand-green px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-brand-green-light transition-colors text-sm sm:text-base"
            >
              <span>Accéder à mon profil</span>
              <ArrowRight size={14} className="sm:w-4 sm:h-4 ml-2" />
            </Link>
          </div>
        )}

        {/* Informations de contact - Optimisées mobile */}
        <div className="mt-6 sm:mt-8 bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 text-center">Besoin d'aide ?</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg sm:rounded-xl">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Phone size={16} className="sm:w-5 sm:h-5 text-gray-500" />
                <span className="text-gray-600 text-sm sm:text-base">Support téléphonique</span>
              </div>
              <span className="font-medium text-gray-900 text-sm sm:text-base">{CONTACT_CONFIG.WHATSAPP_PHONE_DISPLAY}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg sm:rounded-xl">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <MessageCircle size={16} className="sm:w-5 sm:h-5 text-gray-500" />
                <span className="text-gray-600 text-sm sm:text-base">WhatsApp</span>
              </div>
              <span className="font-medium text-gray-900 text-sm sm:text-base">Disponible 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
