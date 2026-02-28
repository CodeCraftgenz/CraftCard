import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, Building2, Crown, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/lib/api';

interface PlanFeature {
  label: string;
  hint?: string;
  free: boolean | string;
  pro: boolean | string;
  business: boolean | string;
  enterprise: boolean | string;
}

const features: PlanFeature[] = [
  { label: 'Cartoes pessoais', free: '1', pro: '3', business: '3', enterprise: '3' },
  { label: 'Assentos na organizacao', free: false, pro: false, business: 'Ate 10', enterprise: 'Ate 10' },
  { label: 'Botoes de links no cartao', hint: 'Redes sociais e links personalizados exibidos no seu cartao digital', free: '5', pro: '20', business: '50', enterprise: '50' },
  { label: 'Temas visuais', free: '3', pro: 'Todos', business: 'Todos', enterprise: 'Todos' },
  { label: 'Analytics de visitas e cliques', free: false, pro: true, business: true, enterprise: true },
  { label: 'Galeria de fotos', free: false, pro: true, business: true, enterprise: true },
  { label: 'Agendamentos online', free: false, pro: true, business: true, enterprise: true },
  { label: 'Depoimentos', free: false, pro: true, business: true, enterprise: true },
  { label: 'Servicos e FAQ', free: false, pro: true, business: true, enterprise: true },
  { label: 'Curriculo e video', free: false, pro: true, business: true, enterprise: true },
  { label: 'Customizacao visual completa', free: false, pro: true, business: true, enterprise: true },
  { label: 'Export de leads (CSV)', free: false, pro: true, business: true, enterprise: true },
  { label: 'Dashboard da organizacao', free: false, pro: false, business: true, enterprise: true },
  { label: 'Branding centralizado', free: false, pro: false, business: true, enterprise: true },
  { label: 'Webhooks e integracoes', free: false, pro: false, business: true, enterprise: true },
  { label: 'Dominio customizado', hint: 'Use o endereco da sua empresa, ex: cartoes.suaempresa.com.br', free: false, pro: false, business: false, enterprise: true },
  { label: 'Marca d\'agua CraftCard', free: 'Sim', pro: 'Nao', business: 'Nao', enterprise: 'Nao' },
];

function FeatureRow({ label, hint, value }: { label: string; hint?: string; value: boolean | string }) {
  const isIncluded = value === true || (typeof value === 'string' && value !== 'false');

  if (typeof value === 'string') {
    return (
      <div className="flex items-center gap-3">
        <Check size={14} className="text-brand-indigo shrink-0" />
        <span className="text-sm text-slate-400 flex-1 inline-flex items-center gap-1">
          {label}
          {hint && <span title={hint}><Info size={12} className="text-slate-600 shrink-0 cursor-help" /></span>}
        </span>
        <span className="text-xs font-semibold text-brand-indigo bg-brand-indigo/10 px-2 py-0.5 rounded-full shrink-0">
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {isIncluded ? (
        <Check size={14} className="text-brand-indigo shrink-0" />
      ) : (
        <X size={14} className="text-white/10 shrink-0" />
      )}
      <span className={`text-sm inline-flex items-center gap-1 ${isIncluded ? 'text-slate-400' : 'text-slate-700'}`}>
        {label}
        {hint && <span title={hint}><Info size={12} className="text-slate-600 shrink-0 cursor-help" /></span>}
      </span>
    </div>
  );
}

export function PricingSection() {
  const { isAuthenticated } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (plan: 'BUSINESS' | 'ENTERPRISE') => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    setLoadingPlan(plan);
    try {
      const data: { url: string } = await api.post('/payments/checkout', { plan });
      window.location.href = data.url;
    } catch {
      setLoadingPlan(null);
    }
  };

  return (
    <section id="preco" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
            Escolha seu <span className="gradient-text">plano</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Comece gratis e faca upgrade quando precisar de mais recursos
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 items-start">
          {/* FREE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            className="glass-card-hover border-glow-hover p-6 relative flex flex-col"
          >
            <div className="mb-6">
              <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-3">Free</p>
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-4xl font-extrabold text-white">R$0</span>
              </div>
              <p className="text-sm text-slate-600 mt-2">Gratis para sempre</p>
            </div>

            <div className="space-y-2.5 mb-8 flex-1">
              {features.map((f, i) => (
                <FeatureRow key={i} label={f.label} hint={f.hint} value={f.free} />
              ))}
            </div>

            <Link
              to={isAuthenticated ? '/editor' : '/login'}
              className="group w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/[0.10] text-white font-semibold hover:bg-white/[0.04] transition-all duration-250 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              Comecar gratis
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </motion.div>

          {/* PRO — Highlighted */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="relative flex flex-col group"
          >
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 opacity-50 group-hover:opacity-80 transition-opacity duration-300" />
            <div className="relative glass-card p-6 flex flex-col flex-1 rounded-2xl group-hover:bg-white/[0.05] transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold gradient-bg text-white px-2.5 py-0.5 rounded-full">
                  Mais popular
                </span>
                <span className="text-xs font-bold bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full">
                  70% OFF
                </span>
              </div>

              <div className="mb-6">
                <p className="text-sm text-indigo-400 font-semibold uppercase tracking-wider mb-1">Pro</p>
                <p className="text-xs text-slate-600 mb-3">Para profissionais individuais</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-base text-slate-600 line-through">R$99,90</span>
                  <span className="font-heading text-4xl font-extrabold gradient-text">R$30</span>
                  <span className="text-sm text-slate-500">/ano</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">Menos de R$2,50 por mes</p>
              </div>

              <div className="space-y-2.5 mb-8 flex-1">
                {features.map((f, i) => (
                  <FeatureRow key={i} label={f.label} hint={f.hint} value={f.pro} />
                ))}
              </div>

              <Link
                to={isAuthenticated ? '/editor' : '/login'}
                className="btn-glossy btn-glow-hover group/btn w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl gradient-bg text-white font-semibold transition-all shadow-lg shadow-indigo-500/20 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
              >
                Assinar Pro
                <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>
          </motion.div>

          {/* BUSINESS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="glass-card-hover border-glow-hover p-6 relative flex flex-col"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <Building2 size={12} />
                Para equipas
              </span>
            </div>

            <div className="mb-6">
              <p className="text-sm text-indigo-400 font-semibold uppercase tracking-wider mb-1">Business</p>
              <p className="text-xs text-slate-600 mb-3">Gestao de equipa centralizada</p>
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-4xl font-extrabold text-white">R$189,90</span>
                <span className="text-sm text-slate-500">/ano</span>
              </div>
              <p className="text-sm text-slate-500 mt-2">Ate 10 membros · ~R$15,83/mes</p>
            </div>

            <div className="space-y-2.5 mb-8 flex-1">
              {features.map((f, i) => (
                <FeatureRow key={i} label={f.label} hint={f.hint} value={f.business} />
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleCheckout('BUSINESS')}
              disabled={loadingPlan !== null}
              className="btn-glossy btn-glow-hover group w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl gradient-bg text-white font-semibold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
            >
              {loadingPlan === 'BUSINESS' ? 'Redirecionando...' : 'Assinar Business'}
              {loadingPlan !== 'BUSINESS' && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />}
            </button>
          </motion.div>

          {/* ENTERPRISE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.24 }}
            className="relative flex flex-col overflow-hidden"
          >
            {/* Border beam animation */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <div className="absolute inset-[-1px] rounded-2xl">
                <div className="absolute animate-border-beam border-beam-gradient" />
              </div>
            </div>
            <div className="glass-card-hover electric-card electric-card-hover p-6 flex flex-col flex-1 border-indigo-500/20 hover:border-violet-500/25">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold bg-gradient-to-r from-indigo-500/15 to-violet-500/15 text-violet-400 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Crown size={12} />
                  Plano completo
                </span>
              </div>

              <div className="mb-6">
                <p className="text-sm text-violet-400 font-semibold uppercase tracking-wider mb-1">Enterprise</p>
                <p className="text-xs text-slate-600 mb-3">Tudo + dominio customizado</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-extrabold text-white">R$299,90</span>
                  <span className="text-sm text-slate-500">/ano</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">Ate 10 membros · ~R$24,99/mes</p>
              </div>

              <div className="space-y-2.5 mb-8 flex-1">
                {features.map((f, i) => (
                  <FeatureRow key={i} label={f.label} hint={f.hint} value={f.enterprise} />
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleCheckout('ENTERPRISE')}
                disabled={loadingPlan !== null}
                className="btn-glossy btn-glow-hover group w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl gradient-bg text-white font-semibold transition-all shadow-lg shadow-violet-600/25 disabled:opacity-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50"
              >
                {loadingPlan === 'ENTERPRISE' ? 'Redirecionando...' : 'Assinar Enterprise'}
                {loadingPlan !== 'ENTERPRISE' && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
