import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, User, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { authService } from '../../services/api';
import { getPhoneValidationResult, sanitizePhoneE164 } from '../../utils/phone';
import { parseAuthFormError, buildRegisterPayload } from '../../utils/authErrors';
import PhoneInput from '../../components/forms/PhoneInput';
import AuthLayout, {
  AuthInput,
  AuthPasswordInput,
  AuthAlert,
  AuthSubmitButton,
  AuthDivider,
} from '../../components/auth/AuthLayout';
import AuthGoogleButton from '../../components/auth/AuthGoogleButton';

const formatPrice = (price) => {
  const num = Number(price);
  if (Number.isNaN(num)) return '0 FCFA';
  return `${Math.round(num).toLocaleString('fr-FR')} FCFA`;
};

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp_phone: '',
    password: '',
    password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formAlert, setFormAlert] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin } = useAuth();
  const { showSuccess, showError } = useNotification();

  const isQuickRegister = location.pathname === '/auth/quick-register';
  const [checkoutData, setCheckoutData] = useState(null);

  useEffect(() => {
    if (isQuickRegister) {
      const storedData = sessionStorage.getItem('checkout_data');
      if (storedData) {
        try {
          setCheckoutData(JSON.parse(storedData));
        } catch {
          navigate('/cart');
        }
      } else {
        navigate('/cart');
      }
    }
  }, [isQuickRegister, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (formAlert) setFormAlert(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) {
      newErrors.name = 'Indiquez votre nom complet';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.whatsapp_phone) {
      newErrors.whatsapp_phone = 'Votre numéro WhatsApp est indispensable pour la livraison';
    } else {
      const phoneCheck = getPhoneValidationResult(formData.whatsapp_phone);
      if (!phoneCheck.valid) {
        newErrors.whatsapp_phone = phoneCheck.message || 'Numéro mobile invalide';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Choisissez un mot de passe';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Minimum 8 caractères';
    }

    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Confirmez votre mot de passe';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const redirectAfterLogin = (loginResult) => {
    if (!loginResult.success) {
      navigate('/auth/login', { replace: true });
      return;
    }

    const user = loginResult.data?.user;
    redirectAfterAuth(user);
  };

  const redirectAfterAuth = (user) => {
    if (isQuickRegister && checkoutData) {
      sessionStorage.removeItem('checkout_data');
      setTimeout(() => {
        navigate('/cart', {
          state: {
            message: 'Compte créé ! Finalisez votre commande en un clic.',
            isNewUser: true,
          },
          replace: true,
        });
      }, 100);
      return;
    }

    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/profile', { replace: true });
    }
  };

  const handleGoogleSuccess = (result) => {
    setErrors({});
    showSuccess(result.data?.is_new_user ? 'Bienvenue chez AfrikRaga !' : 'Connexion réussie !');
    redirectAfterAuth(result.data?.user);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setFormAlert(null);

    try {
      const payload = buildRegisterPayload(formData, sanitizePhoneE164);
      const result = await authService.register(payload);

      if (result.success) {
        showSuccess('Bienvenue chez AfrikRaga ! Votre compte est prêt.');
        const loginResult = await login(formData.whatsapp_phone, formData.password);
        redirectAfterLogin(loginResult.success ? loginResult : { success: true, data: result.data });
        return;
      }

      const parsed = parseAuthFormError(result);
      setErrors(parsed.fieldErrors);
      setFormAlert(parsed);
      showError(parsed.message, parsed.title);
    } catch (err) {
      const parsed = parseAuthFormError({
        message: err?.message,
        errors: err?.errors,
        status: err?.status,
      });
      setErrors(parsed.fieldErrors);
      setFormAlert(parsed);
      showError(parsed.message, parsed.title);
    } finally {
      setIsLoading(false);
    }
  };

  const checkoutBanner =
    isQuickRegister && checkoutData ? (
      <div className="mb-4 bg-brand-green-light border border-brand-green/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-green-dark">Votre panier vous attend</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {checkoutData.cart_summary.total_items} article
              {checkoutData.cart_summary.total_items > 1 ? 's' : ''} ·{' '}
              <span className="font-semibold text-brand-green">
                {formatPrice(checkoutData.cart_summary.total_price)}
              </span>
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Créez votre compte pour finaliser la commande en moins d&apos;une minute.
            </p>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <AuthLayout
      title={isQuickRegister ? 'Plus qu\'une étape !' : 'Rejoignez AfrikRaga'}
      subtitle={
        isQuickRegister
          ? 'Un compte rapide pour valider votre commande — nous vous contactons ensuite par WhatsApp.'
          : 'Créez votre compte gratuitement et découvrez les produits authentiques du Maroc.'
      }
      backTo={isQuickRegister ? '/cart' : '/'}
      backLabel={isQuickRegister ? 'Retour au panier' : 'Accueil'}
      badge="🇲🇦 Inscription gratuite"
      topBanner={checkoutBanner}
      footer={
        <p>
          Déjà membre ?{' '}
          <Link to="/auth/login" className="text-brand-green font-semibold hover:text-brand-green-dark">
            Se connecter
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formAlert && (
          <AuthAlert
            type={formAlert.accountExists ? 'warning' : 'error'}
            title={formAlert.title}
            message={formAlert.message}
            hint={formAlert.hint}
            action={
              formAlert.accountExists ? (
                <Link
                  to="/auth/login"
                  state={{
                    loginMethod: formAlert.duplicateField === 'email' ? 'email' : 'whatsapp',
                    identifier:
                      formAlert.duplicateField === 'email'
                        ? formData.email
                        : formData.whatsapp_phone,
                  }}
                  className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-green hover:bg-brand-green-dark transition-colors"
                >
                  Se connecter avec ce compte →
                </Link>
              ) : null
            }
          />
        )}

        {errors.general && !formAlert && <AuthAlert type="error" message={errors.general} />}

        <AuthInput
          id="name"
          name="name"
          type="text"
          label="Nom complet"
          icon={User}
          value={formData.name}
          onChange={handleInputChange}
          error={errors.name}
          autoComplete="name"
          placeholder="Ex. Aminata Ouédraogo"
        />

        <AuthInput
          id="email"
          name="email"
          type="email"
          label="Adresse email"
          icon={Mail}
          optional
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
          autoComplete="email"
          placeholder="votre@email.com"
          hint="Optionnel — pour vous connecter par email au lieu du WhatsApp"
        />

        <PhoneInput
          id="whatsapp_phone"
          label="Numéro WhatsApp"
          value={formData.whatsapp_phone}
          onChange={(e164) => {
            setFormData((prev) => ({ ...prev, whatsapp_phone: e164 }));
            if (errors.whatsapp_phone) {
              setErrors((prev) => ({ ...prev, whatsapp_phone: '' }));
            }
            if (formAlert) setFormAlert(null);
          }}
          error={errors.whatsapp_phone}
          required
        />

        <AuthPasswordInput
          id="password"
          name="password"
          label="Mot de passe"
          show={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          autoComplete="new-password"
          placeholder="Minimum 8 caractères"
        />

        <AuthPasswordInput
          id="password_confirmation"
          name="password_confirmation"
          label="Confirmer le mot de passe"
          show={showConfirmPassword}
          onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          value={formData.password_confirmation}
          onChange={handleInputChange}
          error={errors.password_confirmation}
          autoComplete="new-password"
          placeholder="Retapez votre mot de passe"
        />

        <AuthSubmitButton
          loading={isLoading}
          loadingText={isQuickRegister ? 'Finalisation…' : 'Création du compte…'}
        >
          {isQuickRegister ? 'Créer mon compte et commander' : 'Créer mon compte'}
        </AuthSubmitButton>
      </form>

      <AuthDivider />

      <AuthGoogleButton
        label="S'inscrire avec Google"
        authenticate={googleLogin}
        onSuccess={handleGoogleSuccess}
        onError={(msg) => setErrors({ general: msg })}
        disabled={isLoading}
      />
    </AuthLayout>
  );
};

export default Register;
