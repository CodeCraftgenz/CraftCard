import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '@/components/atoms/Logo';
import { useAuth } from '@/providers/AuthProvider';
import { GOOGLE_CLIENT_ID } from '@/lib/constants';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const isDev = import.meta.env.DEV;
const SDK_TIMEOUT_MS = 8000;

export function LoginPage() {
  const { login, devLogin, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [sdkFailed, setSdkFailed] = useState(false);
  const [loginError, setLoginError] = useState('');
  const renderedRef = useRef(false);

  const handleGoogleCallback = useCallback(async (response: { credential: string }) => {
    try {
      setLoginError('');
      await login(response.credential);
      navigate('/editor');
    } catch (err: any) {
      console.error('Google login failed:', err);
      setLoginError(err?.message || 'Erro ao fazer login. Tente novamente.');
    }
  }, [login, navigate]);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      navigate('/editor');
      return;
    }

    // Don't re-render if already rendered
    if (renderedRef.current) return;

    const renderGoogleButton = () => {
      if (!window.google || !buttonRef.current) return false;
      if (!GOOGLE_CLIENT_ID) {
        console.error('GOOGLE_CLIENT_ID is empty');
        setSdkFailed(true);
        return false;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'filled_black',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 300,
        });

        renderedRef.current = true;
        return true;
      } catch (err) {
        console.error('Google SDK initialization error:', err);
        setSdkFailed(true);
        return false;
      }
    };

    if (window.google) {
      renderGoogleButton();
    } else {
      // SDK still loading — poll with timeout
      const startTime = Date.now();
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          renderGoogleButton();
        } else if (Date.now() - startTime > SDK_TIMEOUT_MS) {
          clearInterval(interval);
          console.error('Google SDK failed to load within timeout');
          setSdkFailed(true);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isLoading, isAuthenticated, navigate, handleGoogleCallback]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
      </div>
    );
  }

  const handleFallbackLogin = () => {
    // Redirect-based Google OAuth as fallback
    const redirectUri = encodeURIComponent(`${window.location.origin}/login`);
    const scope = encodeURIComponent('openid email profile');
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&prompt=select_account`;
  };

  return (
    <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center px-4">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-cyan/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-brand-magenta/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 sm:p-12 max-w-md w-full text-center relative"
      >
        <Logo className="text-3xl mb-2" />
        <p className="text-white/50 text-sm mb-8">
          Entre com sua conta Google para criar seu cartao digital
        </p>

        {/* Google rendered button */}
        <div ref={buttonRef} className="flex justify-center mb-4" />

        {/* Fallback when Google SDK fails */}
        {sdkFailed && (
          <button
            type="button"
            onClick={handleFallbackLogin}
            className="w-full py-3 px-6 rounded-full bg-white text-gray-800 font-medium text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
          </button>
        )}

        {loginError && (
          <p className="text-red-400 text-xs mb-4">{loginError}</p>
        )}

        {isDev && (
          <button
            type="button"
            onClick={async () => {
              try {
                await devLogin();
                navigate('/editor');
              } catch (err) {
                console.error('Dev login failed:', err);
              }
            }}
            className="w-full py-3 px-6 rounded-full bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan hover:bg-brand-cyan/30 transition-colors text-sm font-medium"
          >
            Dev Login (sem Google)
          </button>
        )}

        <p className="text-xs text-white/30 mt-6">
          Ao continuar, voce concorda com nossos{' '}
          <a href="/termos" className="underline hover:text-white/50">
            Termos de Uso
          </a>{' '}
          e{' '}
          <a href="/privacidade" className="underline hover:text-white/50">
            Politica de Privacidade
          </a>
          .
        </p>
      </motion.div>
    </div>
  );
}
