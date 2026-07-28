import { useEffect, useRef, useState, useCallback } from 'react';
import { authService } from '../../services/api';

const GOOGLE_SCRIPT_ID = 'google-gsi-client';
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const loadGoogleScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google script failed')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google script failed'));
    document.head.appendChild(script);
  });

const AuthGoogleButton = ({ label = 'Continuer avec Google', authenticate, onSuccess, onError, disabled = false }) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const hiddenBtnRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  const handleCredential = useCallback(
    async (response) => {
      if (!response?.credential) {
        onError?.('Connexion Google annulée.');
        return;
      }

      setLoading(true);
      try {
        const authFn = authenticate || ((cred) => authService.googleLogin(cred));
        const result = await authFn(response.credential);
        if (result.success) {
          onSuccess?.(result);
        } else {
          onError?.(result.message || 'Connexion Google impossible.');
        }
      } catch {
        onError?.('Connexion Google impossible pour le moment.');
      } finally {
        setLoading(false);
      }
    },
    [authenticate, onSuccess, onError]
  );

  useEffect(() => {
    if (!clientId) return undefined;

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (hiddenBtnRef.current) {
          hiddenBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(hiddenBtnRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 360,
          });
        }

        setScriptReady(true);
      })
      .catch(() => {
        if (!cancelled) onError?.('Impossible de charger Google. Réessayez.');
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, handleCredential, onError]);

  const handleClick = async () => {
    if (disabled || loading) return;

    if (!clientId) {
      onError?.('Connexion Google bientôt disponible. Utilisez votre email et mot de passe.');
      return;
    }

    if (!scriptReady || !window.google?.accounts?.id) {
      onError?.('Google se charge encore, réessayez dans un instant.');
      return;
    }

    const hiddenButton = hiddenBtnRef.current?.querySelector('div[role="button"]');
    if (hiddenButton) {
      hiddenButton.click();
      return;
    }

    window.google.accounts.id.prompt();
  };

  return (
    <div className="relative">
      <div ref={hiddenBtnRef} className="absolute opacity-0 pointer-events-none h-0 overflow-hidden" aria-hidden />

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-green border-t-transparent" />
            <span>Connexion Google…</span>
          </>
        ) : (
          <>
            <GoogleIcon />
            <span>{label}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default AuthGoogleButton;
