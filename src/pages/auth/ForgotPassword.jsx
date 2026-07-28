import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, Lock, MessageCircle, Inbox, MousePointerClick, KeyRound } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { authService } from '../../services/api';
import { generateWhatsAppLink, CONTACT_CONFIG } from '../../config/contact';
import AuthLayout, {
  AuthInput,
  AuthAlert,
  AuthSubmitButton,
} from '../../components/auth/AuthLayout';

const STEPS = [
  {
    icon: Mail,
    title: 'Entrez votre email',
    text: 'L\'adresse associée à votre compte AfrikRaga',
  },
  {
    icon: Inbox,
    title: 'Consultez votre boîte mail',
    text: 'Le lien arrive en quelques minutes (vérifiez les spams)',
  },
  {
    icon: KeyRound,
    title: 'Choisissez un nouveau mot de passe',
    text: 'Cliquez sur le lien reçu pour sécuriser votre compte',
  },
];

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const { showSuccess, showError } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setErrors({ email: 'Indiquez votre adresse email' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Format d\'email invalide' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await authService.forgotPassword(email);

      if (response.success) {
        showSuccess('Email envoyé ! Consultez votre boîte de réception.');
        setIsSubmitted(true);
      } else {
        showError(response.message || 'Erreur lors de l\'envoi');
        setErrors({ general: response.message || 'Impossible d\'envoyer l\'email pour le moment.' });
      }
    } catch (error) {
      const errorMessage = error.message || 'Impossible d\'envoyer l\'email. Réessayez dans quelques instants.';
      showError(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsSubmitted(false);
    setErrors({});
  };

  const whatsappHelpUrl = generateWhatsAppLink(
    `Bonjour ${CONTACT_CONFIG.COMPANY.name} ! Je n'ai pas reçu l'email de réinitialisation de mot de passe pour ${email}. Pouvez-vous m'aider ?`
  );

  if (isSubmitted) {
    return (
      <AuthLayout
        title="C'est envoyé !"
        subtitle="Vérifiez votre boîte mail pour réinitialiser votre mot de passe."
        backTo="/auth/login"
        backLabel="Connexion"
        badge="🇲🇦 Récupération de compte"
        legalNote={`Besoin d'aide ? ${CONTACT_CONFIG.WHATSAPP_PHONE_DISPLAY}`}
        footer={
          <p>
            <Link to="/auth/login" className="text-brand-green font-semibold hover:text-brand-green-dark">
              ← Retour à la connexion
            </Link>
          </p>
        }
      >
        <div className="space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-green-light flex items-center justify-center mx-auto mb-4 ring-4 ring-brand-green/10">
              <CheckCircle size={32} className="text-brand-green" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Nous avons envoyé un lien sécurisé à
            </p>
            <p className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-green-light text-brand-green-dark text-sm font-semibold border border-brand-green/15">
              <Mail size={15} />
              {email}
            </p>
          </div>

          <div className="rounded-xl bg-brand-cream/80 border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Prochaines étapes</p>
            {STEPS.slice(1).map(({ icon: Icon, title, text }, index) => (
              <div key={title} className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-brand-green text-xs font-bold">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <Icon size={14} className="text-brand-green" />
                    {title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/auth/login"
            className="block w-full py-3.5 rounded-xl font-bold text-sm text-center text-white bg-brand-orange hover:bg-brand-orange-dark transition-all hover:shadow-md"
          >
            Retour à la connexion
          </Link>

          <div className="rounded-xl border border-brand-green/15 bg-white p-4">
            <p className="text-xs text-gray-600 mb-3">
              Toujours rien reçu après 5 minutes ?
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleResend}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-brand-green bg-brand-green-light hover:bg-brand-green-light/80 transition-colors"
              >
                Renvoyer l&apos;email
              </button>
              <a
                href={whatsappHelpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-green hover:bg-brand-green-dark transition-colors flex items-center justify-center gap-1.5"
              >
                <MessageCircle size={14} />
                Aide WhatsApp
              </a>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Mot de passe oublié ?"
      subtitle="Pas de panique — nous vous enverrons un lien sécurisé pour créer un nouveau mot de passe."
      backTo="/auth/login"
      backLabel="Connexion"
      badge="🇲🇦 Récupération de compte"
      footer={
        <p>
          Vous vous en souvenez ?{' '}
          <Link to="/auth/login" className="text-brand-green font-semibold hover:text-brand-green-dark">
            Se connecter
          </Link>
        </p>
      }
    >
      <div className="mb-5 flex items-start gap-3 rounded-xl bg-brand-green-light/60 border border-brand-green/10 p-4">
        <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center flex-shrink-0">
          <Lock size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-green-dark">Votre compte est protégé</p>
          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
            Seul le titulaire de l&apos;email recevra le lien. Personne d&apos;autre ne peut modifier votre mot de passe.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && <AuthAlert type="error" message={errors.general} />}

        <AuthInput
          id="email"
          name="email"
          type="email"
          label="Adresse email du compte"
          icon={Mail}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
          }}
          error={errors.email}
          autoComplete="email"
          placeholder="votre@email.com"
          hint="Utilisez l'email renseigné lors de votre inscription"
        />

        <AuthSubmitButton loading={isLoading} loadingText="Envoi en cours…">
          <span className="inline-flex items-center gap-2">
            <MousePointerClick size={18} />
            Envoyer le lien de réinitialisation
          </span>
        </AuthSubmitButton>
      </form>

      <div className="mt-5 pt-5 border-t border-gray-100">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-3">Comment ça marche</p>
        <div className="space-y-2.5">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <div key={title} className="flex items-center gap-2.5 text-xs text-gray-600">
              <span className="w-5 h-5 rounded-full bg-brand-cream border border-gray-200 flex items-center justify-center text-[10px] font-bold text-brand-green flex-shrink-0">
                {index + 1}
              </span>
              <Icon size={13} className="text-brand-green flex-shrink-0" />
              <span>
                <strong className="text-gray-800">{title}</strong> — {text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
