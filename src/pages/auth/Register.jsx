import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, EnvelopeIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { orderService } from '../../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp_phone: '',
    password: '',
    password_confirmation: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  // Vérifier si c'est un flux de commande rapide
  const isQuickRegister = location.pathname === '/auth/quick-register';
  const [checkoutData, setCheckoutData] = useState(null);

  // Charger les données du panier si c'est un flux de commande rapide
  useEffect(() => {
    if (isQuickRegister) {
      const storedData = sessionStorage.getItem('checkout_data');
      if (storedData) {
        try {
          setCheckoutData(JSON.parse(storedData));
        } catch (error) {
          console.error('Erreur lors du chargement des données du panier:', error);
          navigate('/cart');
        }
      } else {
        // Pas de données de panier, rediriger vers le panier
        navigate('/cart');
      }
    }
  }, [isQuickRegister, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Le nom est requis';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }
    
    if (!formData.email && !formData.whatsapp_phone) {
      newErrors.email = 'Email ou numéro WhatsApp requis';
      newErrors.whatsapp_phone = 'Email ou numéro WhatsApp requis';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    if (!formData.whatsapp_phone) {
      newErrors.whatsapp_phone = 'Le numéro WhatsApp est requis';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.whatsapp_phone.replace(/\s/g, ''))) {
      newErrors.whatsapp_phone = 'Format de numéro WhatsApp invalide';
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }
    
    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'La confirmation du mot de passe est requise';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Appeler directement le service d'API pour l'inscription
      const { authService } = await import('../../services/api');
      const result = await authService.register(formData);
      
      if (result.success) {
        showSuccess('Inscription réussie ! Connexion automatique...');
        
        // Connexion automatique après inscription
        const loginResult = await login(formData.email || formData.whatsapp_phone, formData.password);
        
        if (loginResult.success) {
          // Si c'est un flux de commande rapide, rediriger vers le panier pour finaliser
          if (isQuickRegister && checkoutData) {
            // Nettoyer les données temporaires
            sessionStorage.removeItem('checkout_data');
            
            // Attendre un peu pour que le contexte d'authentification se mette à jour
            setTimeout(() => {
              // Rediriger vers le panier pour que l'utilisateur puisse finaliser sa commande
              navigate('/cart', { 
                state: { 
                  message: 'Inscription réussie ! Vous pouvez maintenant finaliser votre commande.',
                  isNewUser: true 
                },
                replace: true 
              });
            }, 100);
          } else {
            // Rediriger vers le dashboard ou la page d'accueil
            navigate('/admin', { replace: true });
          }
        } else {
          // Si la connexion automatique échoue, rediriger vers la page de connexion
          navigate('/auth/login', { replace: true });
        }
      } else {
        showError(result.message || 'Erreur lors de l\'inscription');
        if (result.errors) {
          setErrors(result.errors);
        }
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      showError('Erreur lors de l\'inscription. Veuillez réessayer.');
      setErrors({ general: 'Erreur lors de l\'inscription. Veuillez réessayer.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl mb-6 transform hover:scale-105 transition-transform duration-300">
            <span className="text-white font-bold text-2xl">BS</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isQuickRegister ? 'Finaliser votre commande' : 'Créer un compte'}
          </h1>
          <p className="text-gray-600">
            {isQuickRegister 
              ? 'Créez votre compte rapidement pour finaliser votre commande'
              : 'Rejoignez BS Shop pour commencer vos achats'
            }
          </p>
          {isQuickRegister && checkoutData && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-800">
                <span className="font-medium">{checkoutData.cart_summary.total_items} article(s)</span> • 
                <span className="font-medium"> {checkoutData.cart_summary.total_price} FCFA</span>
              </p>
            </div>
          )}
        </div>

        {/* Formulaire */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nom complet
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`block w-full pl-12 pr-4 py-4 border-2 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 ${
                    errors.name 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="Votre nom complet"
                  autoComplete="name"
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-600 flex items-center">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2"></span>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Adresse email <span className="text-gray-500">(optionnel)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-12 pr-4 py-4 border-2 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="votre@email.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2"></span>
                  {errors.email}
                </p>
              )}
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <label htmlFor="whatsapp_phone" className="block text-sm font-medium text-gray-700">
                Numéro WhatsApp <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="whatsapp_phone"
                  name="whatsapp_phone"
                  value={formData.whatsapp_phone}
                  onChange={handleInputChange}
                  className={`block w-full pl-12 pr-4 py-4 border-2 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 ${
                    errors.whatsapp_phone 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="+33 1 23 45 67 89"
                  autoComplete="tel"
                />
              </div>
              {errors.whatsapp_phone && (
                <p className="text-sm text-red-600 flex items-center">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2"></span>
                  {errors.whatsapp_phone}
                </p>
              )}
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-12 pr-12 py-4 border-2 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="Votre mot de passe"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 flex items-center">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2"></span>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirmation du mot de passe */}
            <div className="space-y-2">
              <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="password_confirmation"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleInputChange}
                  className={`block w-full pl-12 pr-12 py-4 border-2 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 ${
                    errors.password_confirmation 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="Confirmez votre mot de passe"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password_confirmation && (
                <p className="text-sm text-red-600 flex items-center">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2"></span>
                  {errors.password_confirmation}
                </p>
              )}
            </div>

            {/* Erreur générale */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Bouton d'inscription */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-300 transform ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isQuickRegister ? 'Finalisation...' : 'Création en cours...'}
                </div>
              ) : (
                isQuickRegister ? 'Finaliser ma commande' : 'Créer mon compte'
              )}
            </button>
          </form>

          {/* Séparateur */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/80 text-gray-500">ou</span>
            </div>
          </div>

          {/* Lien de connexion */}
          <div className="text-center">
            <p className="text-gray-600">
              Déjà un compte ?{' '}
              <Link
                to="/auth/login"
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2024 BS Shop. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
