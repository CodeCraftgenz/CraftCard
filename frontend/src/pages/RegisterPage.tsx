import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Crown, Building2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/lib/api';

const PASSWORD_RULES = [
  { test: (v: string) => v.length >= 8, label: 'Mínimo 8 caracteres' },
  { test: (v: string) => /[A-Z]/.test(v), label: '1 letra maiuscula' },
  { test: (v: string) => /[0-9]/.test(v), label: '1 número' },
];

export function RegisterPage() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/editor';
  const inviteToken = searchParams.get('invite') || undefined;
  const inviteEmail = searchParams.get('email') || '';

  // Checkout intent from pricing page
  const checkoutPlan = searchParams.get('plan') as 'PRO' | 'BUSINESS' | null;
  const checkoutSeats = parseInt(searchParams.get('seats') || '1');
  const checkoutCycle = (searchParams.get('cycle') || 'YEARLY') as 'MONTHLY' | 'YEARLY';
  const hasCheckoutIntent = !!checkoutPlan;

  const [name, setName] = useState('');
  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate(redirectTo);
  }, [isLoading, isAuthenticated, navigate, redirectTo]);

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
      const result = await register({ email, name, password, confirmPassword, inviteToken });

      // Auto-checkout if coming from pricing page
      if (hasCheckoutIntent && checkoutPlan) {
        try {
          const data: { url: string } = await api.post('/payments/checkout', {
            plan: checkoutPlan,
            billingCycle: checkoutCycle,
            seatsCount: checkoutSeats,
          });
          window.location.href = data.url;
          return;
        } catch {
          // Checkout failed — still redirect to billing
          navigate('/billing');
          return;
        }
      }

      if (result.joinedOrg) {
        navigate(`/org/${result.joinedOrg.slug}`);
      } else {
        navigate(redirectTo);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
      </div>
    );
  }

  const loginParams = new URLSearchParams();
  loginParams.set('redirect', redirectTo);
  if (checkoutPlan) loginParams.set('plan', checkoutPlan);
  if (checkoutSeats > 1) loginParams.set('seats', String(checkoutSeats));
  if (checkoutCycle) loginParams.set('cycle', checkoutCycle);
  const loginUrl = `/login?${loginParams.toString()}`;

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-brand-cyan/5 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-brand-magenta/5 rounded-full blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              Craft<span className="bg-gradient-to-r from-brand-cyan to-brand-magenta bg-clip-text text-transparent">Card</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Criar conta</h1>
          <p className="text-sm text-white/40">
            {inviteToken ? 'Crie sua conta para entrar na organização' : hasCheckoutIntent ? 'Crie sua conta para continuar com a assinatura' : 'Comece a criar seu cartão digital'}
          </p>

          {/* Checkout intent banner */}
          {hasCheckoutIntent && (
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20">
              <div className="flex items-center gap-2">
                {checkoutPlan === 'PRO' ? <Crown size={16} className="text-indigo-400" /> : <Building2 size={16} className="text-indigo-400" />}
                <span className="text-sm font-semibold text-white">Plano {checkoutPlan}</span>
                {checkoutPlan === 'BUSINESS' && (
                  <span className="text-xs text-indigo-300/60">· {checkoutSeats} membros</span>
                )}
              </div>
              <p className="text-[11px] text-white/40 mt-1">
                Após criar sua conta, você será redirecionado para o pagamento seguro.
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              required
              minLength={2}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/40 focus:ring-1 focus:ring-brand-cyan/20 transition-all text-sm"
            />
          </div>

          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              readOnly={!!inviteEmail}
              className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/40 focus:ring-1 focus:ring-brand-cyan/20 transition-all text-sm ${inviteEmail ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
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

          {/* Password strength indicators */}
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
              placeholder="Confirmar senha"
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
            {isSubmitting ? 'Criando conta...' : inviteToken ? 'Criar conta e entrar na organização' : 'Criar conta'}
          </button>
        </form>

        {/* Login link */}
        <p className="text-sm text-white/40 text-center mt-6">
          Já tem conta?{' '}
          <Link to={loginUrl} className="text-brand-cyan hover:text-brand-cyan/80 font-medium transition-colors">
            Entrar
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
