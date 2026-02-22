import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

export function BillingSuccessPage() {
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();

  useEffect(() => {
    // Refresh auth state so hasPaid gets updated
    refreshAuth();
    const timer = setTimeout(() => navigate('/editor'), 3000);
    return () => clearTimeout(timer);
  }, [navigate, refreshAuth]);

  return (
    <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-12 text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <CheckCircle size={64} className="text-brand-cyan mx-auto mb-6" />
        </motion.div>
        <h1 className="text-2xl font-bold mb-2">Pagamento confirmado!</h1>
        <p className="text-white/50 text-sm mb-4">
          Sua assinatura anual foi ativada com sucesso.
        </p>
        <div className="flex items-center justify-center gap-2 text-brand-cyan text-sm">
          <Sparkles size={16} />
          <span>Redirecionando para o editor...</span>
        </div>
      </motion.div>
    </div>
  );
}
