import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';

const PASSWORD_RULES = [
  { test: (v: string) => v.length >= 8, label: 'Mínimo 8 caracteres' },
  { test: (v: string) => /[A-Z]/.test(v), label: '1 letra maiuscula' },
  { test: (v: string) => /[0-9]/.test(v), label: '1 número' },
];

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Senhas não conferem');
      return;
    }

    const failedRule = PASSWORD_RULES.find((r) => !r.test(password));
    if (failedRule) {
      setError(`Senha: ${failedRule.label}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, password, confirmPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err?.message || 'Token inválido ou expirado. Solicite um novo link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-white/60 mb-4">Link inválido. Solicite um novo link de recuperacao.</p>
          <Link to="/forgot-password" className="text-brand-cyan hover:text-brand-cyan/80 text-sm font-medium">
            Esqueci minha senha
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-white mb-1">Redefinir senha</h1>
          <p className="text-sm text-white/40">
            Crie uma nova senha para sua conta.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle size={28} className="text-emerald-400" />
            </div>
            <p className="text-white/80 text-sm">
              Senha redefinida com sucesso!
            </p>
            <p className="text-white/40 text-xs">
              Redirecionando para o login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nova senha"
                required
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/40 focus:ring-1 focus:ring-brand-cyan/20 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {password.length > 0 && (
              <div className="flex gap-3">
                {PASSWORD_RULES.map((rule, i) => (
                  <span
                    key={i}
                    className={`text-xs ${rule.test(password) ? 'text-emerald-400' : 'text-white/30'} transition-colors`}
                  >
                    {rule.test(password) ? '\u2713' : '\u2022'} {rule.label}
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar nova senha"
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
              {isSubmitting ? 'Redefinindo...' : 'Redefinir senha'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
