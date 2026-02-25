import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

/* Constellation SVG — dots and lines like the reference screenshot */
function ConstellationBg() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="dot-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00E4F2" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#00E4F2" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Lines */}
      <g stroke="rgba(0,228,242,0.08)" strokeWidth="0.5">
        <line x1="10%" y1="15%" x2="25%" y2="30%" />
        <line x1="25%" y1="30%" x2="40%" y2="20%" />
        <line x1="40%" y1="20%" x2="55%" y2="35%" />
        <line x1="55%" y1="35%" x2="70%" y2="25%" />
        <line x1="70%" y1="25%" x2="85%" y2="40%" />
        <line x1="85%" y1="40%" x2="95%" y2="30%" />
        <line x1="15%" y1="60%" x2="30%" y2="70%" />
        <line x1="30%" y1="70%" x2="50%" y2="65%" />
        <line x1="50%" y1="65%" x2="65%" y2="75%" />
        <line x1="65%" y1="75%" x2="80%" y2="60%" />
        <line x1="80%" y1="60%" x2="90%" y2="70%" />
        <line x1="25%" y1="30%" x2="30%" y2="70%" />
        <line x1="55%" y1="35%" x2="50%" y2="65%" />
        <line x1="70%" y1="25%" x2="65%" y2="75%" />
        <line x1="20%" y1="85%" x2="40%" y2="90%" />
        <line x1="40%" y1="90%" x2="60%" y2="82%" />
        <line x1="60%" y1="82%" x2="75%" y2="92%" />
        <line x1="30%" y1="70%" x2="40%" y2="90%" />
        <line x1="50%" y1="65%" x2="60%" y2="82%" />
        <line x1="5%" y1="45%" x2="15%" y2="60%" />
        <line x1="90%" y1="15%" x2="85%" y2="40%" />
        <line x1="10%" y1="15%" x2="5%" y2="45%" />
      </g>
      {/* Dots — varying sizes */}
      <g>
        <circle cx="10%" cy="15%" r="2" fill="rgba(0,228,242,0.5)" />
        <circle cx="25%" cy="30%" r="2.5" fill="rgba(0,228,242,0.6)" />
        <circle cx="40%" cy="20%" r="1.5" fill="rgba(209,43,242,0.5)" />
        <circle cx="55%" cy="35%" r="3" fill="rgba(0,228,242,0.7)" />
        <circle cx="70%" cy="25%" r="2" fill="rgba(209,43,242,0.4)" />
        <circle cx="85%" cy="40%" r="2.5" fill="rgba(0,228,242,0.5)" />
        <circle cx="95%" cy="30%" r="1.5" fill="rgba(209,43,242,0.3)" />
        <circle cx="15%" cy="60%" r="2" fill="rgba(209,43,242,0.5)" />
        <circle cx="30%" cy="70%" r="3" fill="rgba(0,228,242,0.6)" />
        <circle cx="50%" cy="65%" r="2" fill="rgba(209,43,242,0.4)" />
        <circle cx="65%" cy="75%" r="2.5" fill="rgba(0,228,242,0.5)" />
        <circle cx="80%" cy="60%" r="1.5" fill="rgba(209,43,242,0.6)" />
        <circle cx="90%" cy="70%" r="2" fill="rgba(0,228,242,0.4)" />
        <circle cx="5%" cy="45%" r="1.5" fill="rgba(0,228,242,0.3)" />
        <circle cx="90%" cy="15%" r="2" fill="rgba(0,228,242,0.3)" />
        <circle cx="20%" cy="85%" r="1.5" fill="rgba(209,43,242,0.3)" />
        <circle cx="40%" cy="90%" r="2" fill="rgba(0,228,242,0.4)" />
        <circle cx="60%" cy="82%" r="2.5" fill="rgba(209,43,242,0.5)" />
        <circle cx="75%" cy="92%" r="1.5" fill="rgba(0,228,242,0.3)" />
      </g>
      {/* Glow spots */}
      <circle cx="55%" cy="35%" r="15" fill="url(#dot-glow)" opacity="0.3" />
      <circle cx="30%" cy="70%" r="12" fill="url(#dot-glow)" opacity="0.2" />
    </svg>
  );
}

export function LoginPage() {
  const { login, devLogin, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/editor';
  const buttonRef = useRef<HTMLDivElement>(null);
  const [sdkFailed, setSdkFailed] = useState(false);
  const [loginError, setLoginError] = useState('');
  const renderedRef = useRef(false);

  const handleGoogleCallback = useCallback(async (response: { credential: string }) => {
    try {
      setLoginError('');
      await login(response.credential);
      navigate(redirectTo);
    } catch (err: any) {
      console.error('Google login failed:', err);
      setLoginError(err?.message || 'Erro ao fazer login. Tente novamente.');
    }
  }, [login, navigate, redirectTo]);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      navigate(redirectTo);
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
      <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center">
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
    <div className="min-h-screen bg-[#0B0E1A] flex relative overflow-hidden">
      {/* Global constellation background */}
      <div className="absolute inset-0 pointer-events-none">
        <ConstellationBg />
      </div>

      {/* Left side — form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center px-8 lg:px-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile large CC */}
          <div className="lg:hidden flex justify-center mb-8">
            <span
              className="text-7xl font-black bg-clip-text text-transparent select-none"
              style={{ backgroundImage: 'linear-gradient(135deg, #00E4F2 0%, #8B5CF6 40%, #D12BF2 100%)' }}
            >
              CC
            </span>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <p className="text-white/40 text-sm tracking-widest uppercase mb-2">Bem-vindo</p>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
              Craft<span className="bg-gradient-to-r from-brand-cyan to-brand-magenta bg-clip-text text-transparent">Card</span>
            </h1>
            <p className="text-white/40 text-sm">
              Tecnologia para maximizar resultados.
            </p>
          </div>

          {/* Google rendered button */}
          <div className="mb-4">
            <div ref={buttonRef} className="flex justify-center" />
          </div>

          {/* Fallback when Google SDK fails */}
          {sdkFailed && (
            <button
              type="button"
              onClick={handleFallbackLogin}
              className="w-full py-4 px-6 rounded-xl font-semibold text-sm text-white transition-all duration-300 flex items-center justify-center gap-3 mb-4 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #00E4F2, #8B5CF6, #D12BF2)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com Google
            </button>
          )}

          {loginError && (
            <p className="text-red-400 text-xs text-center mb-4">{loginError}</p>
          )}

          {isDev && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await devLogin();
                  navigate(redirectTo);
                } catch (err) {
                  console.error('Dev login failed:', err);
                }
              }}
              className="w-full py-3.5 px-6 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/20 transition-all duration-200 text-sm font-medium mb-4"
            >
              Dev Login (sem Google)
            </button>
          )}

          {/* Terms */}
          <p className="text-xs text-white/25 mt-8">
            Ao continuar, voce concorda com nossos{' '}
            <a href="/termos" className="underline hover:text-white/40 transition-colors">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="/privacidade" className="underline hover:text-white/40 transition-colors">
              Politica de Privacidade
            </a>
            .
          </p>
        </motion.div>
      </div>

      {/* Right side — large "CC" visual with glow */}
      <div className="hidden lg:flex lg:w-[55%] items-center justify-center relative">
        {/* Glow behind the letters */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] bg-brand-cyan/8 rounded-full blur-[180px]" />
          <div className="absolute w-[400px] h-[400px] bg-brand-magenta/8 rounded-full blur-[150px] translate-x-20 translate-y-10" />
        </div>

        {/* Large stylized CC */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="relative z-10 select-none"
        >
          <span
            className="text-[20rem] font-black leading-none bg-clip-text text-transparent drop-shadow-2xl"
            style={{
              backgroundImage: 'linear-gradient(135deg, #00E4F2 0%, #7C3AED 40%, #D12BF2 70%, #FF69B4 100%)',
              WebkitTextStroke: '1px rgba(255,255,255,0.05)',
              filter: 'drop-shadow(0 0 80px rgba(0,228,242,0.15)) drop-shadow(0 0 40px rgba(209,43,242,0.1))',
            }}
          >
            CC
          </span>

          {/* Subtle reflection */}
          <span
            className="absolute top-0 left-0 text-[20rem] font-black leading-none bg-clip-text text-transparent opacity-[0.08] blur-[2px]"
            style={{
              backgroundImage: 'linear-gradient(135deg, #fff 0%, transparent 60%)',
              transform: 'scaleY(-0.3) translateY(100%)',
            }}
            aria-hidden="true"
          >
            CC
          </span>
        </motion.div>

        {/* Bottom tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="absolute bottom-16 text-white/30 text-sm tracking-[0.2em] uppercase"
        >
          Seu cartao digital profissional
        </motion.p>
      </div>
    </div>
  );
}
