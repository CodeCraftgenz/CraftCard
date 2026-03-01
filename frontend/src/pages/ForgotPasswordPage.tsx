import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-cyan/5 rounded-full blur-[180px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              Craft<span className="bg-gradient-to-r from-brand-cyan to-brand-magenta bg-clip-text text-transparent">Card</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Esqueceu a senha?</h1>
          <p className="text-sm text-white/40">
            Insira seu email e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <Mail size={28} className="text-emerald-400" />
            </div>
            <p className="text-white/80 text-sm">
              Se o email <strong className="text-white">{email}</strong> estiver cadastrado, enviaremos um link de recuperacao.
            </p>
            <p className="text-white/40 text-xs">
              Verifique tambem a pasta de spam.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-brand-cyan hover:text-brand-cyan/80 transition-colors mt-4"
            >
              <ArrowLeft size={14} />
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/40 focus:ring-1 focus:ring-brand-cyan/20 transition-all text-sm"
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 rounded-xl font-semibold text-sm text-white transition-all duration-300 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #00E4F2, #8B5CF6, #D12BF2)' }}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar link de recuperacao'}
              </button>
            </form>

            <div className="text-center mt-6">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
              >
                <ArrowLeft size={14} />
                Voltar ao login
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
