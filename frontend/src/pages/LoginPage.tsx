import { useEffect, useRef, useCallback } from 'react';
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

export function LoginPage() {
  const { login, devLogin, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleGoogleCallback = useCallback(async (response: { credential: string }) => {
    await login(response.credential);
    navigate('/editor');
  }, [login, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/editor');
      return;
    }

    if (!window.google || !buttonRef.current) return;

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
  }, [isAuthenticated, navigate, handleGoogleCallback]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
      </div>
    );
  }

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

        <div ref={buttonRef} className="flex justify-center mb-6" />

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
