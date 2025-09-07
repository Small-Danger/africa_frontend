import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  cartService,
  orderService
} from '../../services/api'
import { CONTACT_CONFIG } from '../../config/contact'

const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // États du formulaire
  const [formData, setFormData] = useState({
    // Informations de livraison
    shipping_first_name: '',
    shipping_last_name: '',
    shipping_address: '',
    shipping_city: '',
    shipping_postal_code: '',
    shipping_country: 'France',
    shipping_phone: '',

    // Informations de facturation
    billing_first_name: '',
    billing_last_name: '',
    billing_address: '',
    billing_city: '',
    billing_postal_code: '',
    billing_country: 'France',

    // Options de livraison et paiement
    shipping_method: 'standard',
    payment_method: 'card',
    use_same_address: true,

    // Conditions
    accept_terms: false,
    accept_marketing: false
  });

  // Charger le panier au montage
  useEffect(() => {
    loadCart();
  }, []);

  // Synchroniser les adresses de facturation
  useEffect(() => {
    if (formData.use_same_address) {
      setFormData(prev => ({
        ...prev,
        billing_first_name: prev.shipping_first_name,
        billing_last_name: prev.shipping_last_name,
        billing_address: prev.shipping_address,
        billing_city: prev.shipping_city,
        billing_postal_code: prev.shipping_postal_code,
        billing_country: prev.shipping_country
      }));
    }
  }, [formData.use_same_address, formData.shipping_first_name, formData.shipping_last_name, formData.shipping_address, formData.shipping_city, formData.shipping_postal_code, formData.shipping_country]);

  // ========================================
  // FONCTIONS DE CHARGEMENT DES DONNÉES
  // ========================================

  const loadCart = async () => {
    try {
      setLoading(true);
      
      // Récupérer la session ID du panier depuis le localStorage
      const cartSessionId = localStorage.getItem('cart_session_id');
      
      // Préparer les headers avec la session du panier
      const headers = {};
      if (cartSessionId) {
        headers['X-Session-ID'] = cartSessionId;
      }
      
      console.log('🛒 Chargement du panier avec session:', cartSessionId);
      
      const response = await cartService.getCart(headers);
      if (response.success) {
        setCart(response.data);
        
        // Pré-remplir avec les informations utilisateur si disponibles
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        if (userInfo.first_name) {
          setFormData(prev => ({
            ...prev,
            shipping_first_name: userInfo.first_name || '',
            shipping_last_name: userInfo.last_name || '',
            shipping_phone: userInfo.phone || ''
          }));
        }
      }
    } catch (error) {
      setError('Erreur lors du chargement du panier: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // GESTION DU FORMULAIRE
  // ========================================

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.accept_terms) {
      alert('Veuillez accepter les conditions générales de vente');
      return;
    }

    try {
      setSubmitting(true);
      
      const orderData = {
        cart_id: cart.id,
        shipping_address: {
          first_name: formData.shipping_first_name,
          last_name: formData.shipping_last_name,
          address: formData.shipping_address,
          city: formData.shipping_city,
          postal_code: formData.shipping_postal_code,
          country: formData.shipping_country,
          phone: formData.shipping_phone
        },
        billing_address: formData.use_same_address ? null : {
          first_name: formData.billing_first_name,
          last_name: formData.billing_last_name,
          address: formData.billing_address,
          city: formData.billing_city,
          postal_code: formData.billing_postal_code,
          country: formData.billing_country
        },
        shipping_method: formData.shipping_method,
        payment_method: formData.payment_method,
        notes: '',
        marketing_consent: formData.accept_marketing
      };

      const response = await orderService.createOrder(orderData);
      if (response.success) {
        // Rediriger vers la page de confirmation
        navigate(`/order-confirmation/${response.data.order_id}`);
      }
    } catch (error) {
      alert('Erreur lors de la création de la commande: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Chargement de la commande...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md mx-auto">
          <h2 className="text-lg font-bold mb-2">Erreur</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.total_items === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Votre panier est vide</h2>
        <p className="text-gray-600 mb-8">
          Vous devez avoir des articles dans votre panier pour passer une commande.
        </p>
        <button
          onClick={() => navigate('/catalog')}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Voir le catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Finaliser la commande</h1>
          <p className="text-gray-600 mt-1">
            Étape 3/3 - Informations de livraison et paiement
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Adresse de livraison */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Adresse de livraison
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shipping_first_name}
                    onChange={(e) => handleInputChange('shipping_first_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shipping_last_name}
                    onChange={(e) => handleInputChange('shipping_last_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shipping_address}
                    onChange={(e) => handleInputChange('shipping_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 Rue de la Paix"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shipping_city}
                    onChange={(e) => handleInputChange('shipping_city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code postal *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shipping_postal_code}
                    onChange={(e) => handleInputChange('shipping_postal_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays *
                  </label>
                  <select
                    required
                    value={formData.shipping_country}
                    onChange={(e) => handleInputChange('shipping_country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="France">France</option>
                    <option value="Belgique">Belgique</option>
                    <option value="Suisse">Suisse</option>
                    <option value="Luxembourg">Luxembourg</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.shipping_phone}
                    onChange={(e) => handleInputChange('shipping_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={CONTACT_CONFIG.PHONE_PLACEHOLDER}
                  />
                </div>
              </div>
            </div>

            {/* Adresse de facturation */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Adresse de facturation
                </h2>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.use_same_address}
                    onChange={(e) => handleInputChange('use_same_address', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Même adresse que la livraison
                  </span>
                </label>
              </div>
              
              {!formData.use_same_address && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      required={!formData.use_same_address}
                      value={formData.billing_first_name}
                      onChange={(e) => handleInputChange('billing_first_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      required={!formData.use_same_address}
                      value={formData.billing_last_name}
                      onChange={(e) => handleInputChange('billing_last_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse *
                    </label>
                    <input
                      type="text"
                      required={!formData.use_same_address}
                      value={formData.billing_address}
                      onChange={(e) => handleInputChange('billing_address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ville *
                    </label>
                    <input
                      type="text"
                      required={!formData.use_same_address}
                      value={formData.billing_city}
                      onChange={(e) => handleInputChange('billing_city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code postal *
                    </label>
                    <input
                      type="text"
                      required={!formData.use_same_address}
                      value={formData.billing_postal_code}
                      onChange={(e) => handleInputChange('billing_postal_code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pays *
                    </label>
                    <select
                      required={!formData.use_same_address}
                      value={formData.billing_country}
                      onChange={(e) => handleInputChange('billing_country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="France">France</option>
                      <option value="Belgique">Belgique</option>
                      <option value="Suisse">Suisse</option>
                      <option value="Luxembourg">Luxembourg</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Options de livraison et paiement */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Livraison et paiement
              </h2>
              
              <div className="space-y-6">
                {/* Méthode de livraison */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Méthode de livraison
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="shipping_method"
                        value="standard"
                        checked={formData.shipping_method === 'standard'}
                        onChange={(e) => handleInputChange('shipping_method', e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3">
                        <span className="block text-sm font-medium text-gray-900">
                          Livraison standard (3-5 jours ouvrables)
                        </span>
                        <span className="block text-sm text-gray-500">
                          Gratuite dès 50000 FCFA d'achat
                        </span>
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="shipping_method"
                        value="express"
                        checked={formData.shipping_method === 'express'}
                        onChange={(e) => handleInputChange('shipping_method', e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3">
                        <span className="block text-sm font-medium text-gray-900">
                          Livraison express (1-2 jours ouvrables)
                        </span>
                        <span className="block text-sm text-gray-500">
                          +9900 FCFA
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Méthode de paiement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Méthode de paiement
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="payment_method"
                        value="card"
                        checked={formData.payment_method === 'card'}
                        onChange={(e) => handleInputChange('payment_method', e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3">
                        <span className="block text-sm font-medium text-gray-900">
                          Carte bancaire
                        </span>
                        <span className="block text-sm text-gray-500">
                          Visa, Mastercard, American Express
                        </span>
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="payment_method"
                        value="paypal"
                        checked={formData.payment_method === 'paypal'}
                        onChange={(e) => handleInputChange('payment_method', e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3">
                        <span className="block text-sm font-medium text-gray-900">
                          PayPal
                        </span>
                        <span className="block text-sm text-gray-500">
                          Paiement sécurisé via PayPal
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditions et consentements */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    required
                    checked={formData.accept_terms}
                    onChange={(e) => handleInputChange('accept_terms', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    J'accepte les{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-800 underline">
                      conditions générales de vente
                    </a>{' '}
                    et la{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-800 underline">
                      politique de confidentialité
                    </a>
                    *
                  </span>
                </label>
                
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.accept_marketing}
                    onChange={(e) => handleInputChange('accept_marketing', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    J'accepte de recevoir des offres promotionnelles et des newsletters
                    (vous pouvez vous désabonner à tout moment)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Résumé de la commande */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Résumé de la commande
              </h2>
              
              {/* Articles */}
              <div className="space-y-3 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product.name} x {item.quantity}
                    </span>
                    <span className="text-gray-900">
                      {Math.round(item.price * item.quantity)} FCFA
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Totaux */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="text-gray-900">{Math.round(cart.subtotal)} FCFA</span>
                </div>
                
                {cart.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Réduction</span>
                    <span className="text-green-600">-{Math.round(cart.discount_amount)} FCFA</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Livraison</span>
                  <span className="text-gray-900">
                    {formData.shipping_method === 'express' ? '9900 FCFA' : 'Gratuite'}
                  </span>
                </div>
                
                {cart.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">TVA</span>
                    <span className="text-gray-900">{Math.round(cart.tax_amount)} FCFA</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">
                      {Math.round(cart.total_price + (formData.shipping_method === 'express' ? 9900 : 0))} FCFA
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Bouton de commande */}
              <button
                type="submit"
                disabled={submitting || !formData.accept_terms}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors mt-6"
              >
                {submitting ? 'Traitement...' : 'Confirmer la commande'}
              </button>
              
              <p className="text-xs text-gray-500 text-center mt-3">
                En confirmant votre commande, vous acceptez nos conditions générales de vente.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  )
}

export default Checkout
