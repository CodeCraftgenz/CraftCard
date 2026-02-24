import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/lib/api';

export function BillingSuccessPage() {
  const navigate = useNavigate();
  const { refreshAuth, plan } = useAuth();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function verifyAndRedirect() {
      // Try to verify payment status via API (fallback for missing webhooks)
      try {
        await api.post('/payments/verify');
      } catch {
        // Ignore errors - webhook may still arrive
      }

      // Refresh auth state so hasPaid gets updated
      await refreshAuth();
      if (cancelled) return;

      setVerifying(false);

      // Wait a bit then redirect
      setTimeout(() => {
        if (!cancelled) navigate('/tutorial');
      }, 2000);
    }

    verifyAndRedirect();
    return () => { cancelled = true; };
  }, [navigate, refreshAuth]);

  return (
    <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-12 text-center max-w-md"
      >
        {verifying ? (
          <>
            <Loader2 size={64} className="text-brand-cyan mx-auto mb-6 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Verificando pagamento...</h1>
            <p className="text-white/50 text-sm mb-4">
              Aguarde enquanto confirmamos seu pagamento.
            </p>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <CheckCircle size={64} className="text-brand-cyan mx-auto mb-6" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Pagamento confirmado!</h1>
            <p className="text-white/50 text-sm mb-4">
              Seu plano <span className="text-brand-cyan font-semibold">{plan === 'BUSINESS' ? 'Business' : 'Pro'}</span> foi ativado com sucesso.
            </p>
            <div className="flex items-center justify-center gap-2 text-brand-cyan text-sm">
              <Sparkles size={16} />
              <span>Redirecionando para o tutorial...</span>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
