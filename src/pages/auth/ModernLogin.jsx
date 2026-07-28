import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { authService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getPhoneValidationResult } from '../../utils/phone';
import { parseAuthFormError } from '../../utils/authErrors';
import PhoneInput from '../../components/forms/PhoneInput';
import AuthLayout, {
  AuthInput,
  AuthPasswordInput,
  AuthAlert,
  AuthSubmitButton,
  AuthDivider,
} from '../../components/auth/AuthLayout';
import AuthGoogleButton from '../../components/auth/AuthGoogleButton';

const ModernLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilled = location.state || {};
  const { login, googleLogin } = useAuth();
  const [loginMethod, setLoginMethod] = useState(prefilled.loginMethod || 'whatsapp');
  const [formData, setFormData] = useState({
    whatsapp_phone: prefilled.loginMethod === 'whatsapp' ? prefilled.identifier || '' : '',
    email: prefilled.loginMethod === 'email' ? prefilled.identifier || '' : '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formAlert, setFormAlert] = useState(null);

  const redirectAfterAuth = (user) => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/profile', { replace: true });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formAlert) setFormAlert(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormAlert(null);

    const identifier =
      loginMethod === 'email' ? formData.email.trim() : formData.whatsapp_phone;

    if (loginMethod === 'email' && !identifier) {
      setFormAlert({
        title: 'Email manquant',
        message: 'Indiquez l\'adresse email utilisée lors de votre inscription.',
      });
      setIsLoading(false);
      return;
    }

    if (loginMethod === 'whatsapp') {
      if (!identifier) {
        setFormAlert({
          title: 'Numéro manquant',
          message: 'Indiquez votre numéro WhatsApp enregistré sur AfrikRaga.',
        });
        setIsLoading(false);
        return;
      }
      const phoneCheck = getPhoneValidationResult(identifier);
      if (!phoneCheck.valid) {
        setFormAlert({
          title: 'Numéro incorrect',
          message: phoneCheck.message || 'Vérifiez l\'indicatif pays et le format du numéro.',
          hint: phoneCheck.operatorHint,
        });
        setIsLoading(false);
        return;
      }
    }

    if (!formData.password) {
      setFormAlert({
        title: 'Mot de passe manquant',
        message: 'Saisissez votre mot de passe pour vous connecter.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await login(identifier, formData.password);

      if (response.success) {
        const user = response.data?.user || authService.getCurrentUser();
        redirectAfterAuth(user);
        return;
      }

      const parsed = parseAuthFormError(response);
      setFormAlert({
        ...parsed,
        hint:
          parsed.hint ||
          (loginMethod === 'whatsapp'
            ? 'Pas encore de compte ? Créez-en un avec ce numéro.'
            : 'Vous pouvez aussi vous connecter avec votre WhatsApp.'),
      });
    } catch (err) {
      setFormAlert(parseAuthFormError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = (result) => {
    setFormAlert(null);
    redirectAfterAuth(result.data?.user);
  };

  const switchMethod = (method) => {
    setLoginMethod(method);
    setFormAlert(null);
  };

  return (
    <AuthLayout
      title="Bon retour parmi nous"
      subtitle="Connectez-vous avec votre WhatsApp ou votre email pour accéder à votre compte."
      backTo="/"
      backLabel="Accueil"
      badge="🇲🇦 AfrikRaga"
      footer={
        <p>
          Pas encore de compte ?{' '}
          <Link to="/auth/register" className="text-brand-green font-semibold hover:text-brand-green-dark">
            Créer un compte gratuitement
          </Link>
        </p>
      }
    >
      <div className="flex rounded-xl bg-brand-cream/80 border border-gray-100 p-1 mb-4">
        <button
          type="button"
          onClick={() => switchMethod('whatsapp')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
            loginMethod === 'whatsapp'
              ? 'bg-white text-brand-green shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          WhatsApp
        </button>
        <button
          type="button"
          onClick={() => switchMethod('email')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
            loginMethod === 'email'
              ? 'bg-white text-brand-green shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Email
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {formAlert && (
          <AuthAlert
            type="error"
            title={formAlert.title}
            message={formAlert.message}
            hint={formAlert.hint}
            action={
              loginMethod === 'whatsapp' ? (
                <Link
                  to="/auth/register"
                  className="inline-flex text-xs font-bold text-brand-green hover:text-brand-green-dark underline underline-offset-2"
                >
                  Créer un compte avec ce numéro
                </Link>
              ) : null
            }
          />
        )}

        {loginMethod === 'whatsapp' ? (
          <PhoneInput
            id="login_whatsapp"
            label="Numéro WhatsApp"
            value={formData.whatsapp_phone}
            onChange={(e164) => {
              setFormData((prev) => ({ ...prev, whatsapp_phone: e164 }));
              if (formAlert) setFormAlert(null);
            }}
            hint="Même numéro qu'à l'inscription — c'est votre identifiant principal"
            required
          />
        ) : (
          <AuthInput
            id="email"
            name="email"
            type="email"
            label="Adresse email"
            icon={Mail}
            value={formData.email}
            onChange={handleInputChange}
            autoComplete="email"
            placeholder="votre@email.com"
            hint="Uniquement si vous avez renseigné un email à l'inscription"
          />
        )}

        <AuthPasswordInput
          id="password"
          name="password"
          label="Mot de passe"
          show={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
          value={formData.password}
          onChange={handleInputChange}
          required
          autoComplete="current-password"
          placeholder="Votre mot de passe"
        />

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
            />
            <span className="text-xs text-gray-600">Se souvenir de moi</span>
          </label>
          <Link
            to="/auth/forgot-password"
            className="text-xs font-semibold text-brand-green hover:text-brand-green-dark"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <AuthSubmitButton loading={isLoading} loadingText="Connexion en cours…">
          Se connecter
        </AuthSubmitButton>
      </form>

      <AuthDivider />

      <AuthGoogleButton
        authenticate={googleLogin}
        onSuccess={handleGoogleSuccess}
        onError={(msg) => setFormAlert({ title: 'Google', message: msg })}
        disabled={isLoading}
      />

      <div className="mt-5 pt-5 border-t border-gray-100">
        <p className="text-xs text-center text-gray-500 mb-3">Vous commandez sans compte ?</p>
        <Link
          to="/catalog"
          className="block w-full text-center py-3 rounded-xl text-sm font-semibold text-brand-green bg-brand-green-light hover:bg-brand-green-light/80 transition-colors"
        >
          Continuer mes achats →
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ModernLogin;
