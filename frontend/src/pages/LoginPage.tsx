import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
          text: 'continue_with',
          shape: 'pill',
          width: 320,
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
    const redirectUri = encodeURIComponent(`${window.location.origin}/login`);
    const scope = encodeURIComponent('openid email profile');
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&prompt=select_account`;
  };

  return (
    <div className="min-h-screen bg-brand-bg-dark flex">
      {/* Left side — branding visual */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-cyan/15 rounded-full blur-[150px] animate-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-magenta/15 rounded-full blur-[120px] animate-glow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand-purple/10 rounded-full blur-[100px] animate-glow" style={{ animationDelay: '3s' }} />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Company logo + tagline */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 text-center px-12"
        >
          <img
            src="/logo-codecraftgenz.png"
            alt="CodeCraftGenZ"
            className="w-80 mx-auto mb-8 drop-shadow-2xl"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h2 className="text-white/80 text-lg font-light tracking-wide mb-3">
              Sua identidade digital, profissional e moderna
            </h2>
            <div className="flex items-center justify-center gap-6 text-white/40 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                QR Code
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-magenta" />
                Portfolio
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                Analytics
              </span>
            </div>
          </motion.div>

          {/* Floating card mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-12"
          >
            <div className="w-56 mx-auto bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-cyan to-brand-magenta mx-auto mb-3" />
              <div className="h-3 w-28 bg-white/20 rounded mx-auto mb-2" />
              <div className="h-2 w-20 bg-white/10 rounded mx-auto mb-4" />
              <div className="space-y-2">
                <div className="h-8 bg-white/10 rounded-lg" />
                <div className="h-8 bg-white/10 rounded-lg" />
                <div className="h-8 bg-white/10 rounded-lg" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right side — login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 relative">
        {/* Mobile-only background effects */}
        <div className="lg:hidden absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-80 h-80 bg-brand-cyan/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-brand-magenta/10 rounded-full blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-sm relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <img
              src="/logo-codecraftgenz.png"
              alt="CodeCraftGenZ"
              className="w-48 mx-auto mb-4"
            />
          </div>

          {/* CraftCard name */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">
              <span className="bg-gradient-to-r from-brand-cyan via-brand-magenta to-brand-purple bg-clip-text text-transparent">
                CraftCard
              </span>
            </h1>
            <p className="text-white/50 text-sm">
              Entre com sua conta para criar seu cartao digital profissional
            </p>
          </div>

          {/* Login buttons container */}
          <div className="space-y-3 mb-6">
            {/* Google rendered button */}
            <div ref={buttonRef} className="flex justify-center" />

            {/* Fallback when Google SDK fails */}
            {sdkFailed && (
              <button
                type="button"
                onClick={handleFallbackLogin}
                className="w-full py-3.5 px-6 rounded-xl bg-white text-gray-800 font-medium text-sm hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar com Google
              </button>
            )}

            {loginError && (
              <p className="text-red-400 text-xs text-center">{loginError}</p>
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
                className="w-full py-3.5 px-6 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/20 transition-all duration-200 text-sm font-medium"
              >
                Dev Login (sem Google)
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">Rapido e seguro</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Features highlight */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { icon: '🔗', text: 'Links sociais' },
              { icon: '📊', text: 'Analytics' },
              { icon: '📅', text: 'Agendamentos' },
              { icon: '🎨', text: 'Temas visuais' },
            ].map((f) => (
              <div
                key={f.text}
                className="flex items-center gap-2 text-white/40 text-xs bg-white/5 rounded-lg px-3 py-2"
              >
                <span>{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>

          {/* Terms */}
          <p className="text-xs text-white/30 text-center">
            Ao continuar, voce concorda com nossos{' '}
            <a href="/termos" className="underline hover:text-white/50 transition-colors">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="/privacidade" className="underline hover:text-white/50 transition-colors">
              Politica de Privacidade
            </a>
            .
          </p>
        </motion.div>
      </div>
    </div>
  );
}
