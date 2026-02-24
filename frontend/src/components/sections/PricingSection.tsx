import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/lib/api';

interface PlanFeature {
  label: string;
  free: boolean | string;
  pro: boolean | string;
  business: boolean | string;
}

const features: PlanFeature[] = [
  { label: 'Cartoes digitais', free: '1', pro: '5', business: '50/membro' },
  { label: 'Links personalizados', free: '5', pro: '20', business: '50' },
  { label: 'Temas visuais', free: '3', pro: 'Todos', business: 'Todos' },
  { label: 'Analytics de visitas e cliques', free: false, pro: true, business: true },
  { label: 'Galeria de fotos', free: false, pro: true, business: true },
  { label: 'Agendamentos online', free: false, pro: true, business: true },
  { label: 'Depoimentos', free: false, pro: true, business: true },
  { label: 'Servicos e FAQ', free: false, pro: true, business: true },
  { label: 'Curriculo e video', free: false, pro: true, business: true },
  { label: 'Customizacao visual completa', free: false, pro: true, business: true },
  { label: 'Export de leads (CSV)', free: false, pro: true, business: true },
  { label: 'Dashboard da organizacao', free: false, pro: false, business: true },
  { label: 'Branding centralizado', free: false, pro: false, business: true },
  { label: 'Webhooks e integracoes', free: false, pro: false, business: true },
  { label: 'Marca d\'agua CraftCard', free: 'Sim', pro: 'Nao', business: 'Nao' },
];

function FeatureRow({ label, value }: { label: string; value: boolean | string }) {
  const isIncluded = value === true || (typeof value === 'string' && value !== 'false');

  if (typeof value === 'string') {
    return (
      <div className="flex items-center gap-3">
        <Check size={14} className="text-emerald-400 shrink-0" />
        <span className="text-sm text-white/70 flex-1">{label}</span>
        <span className="text-xs font-semibold text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded-full shrink-0">
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {isIncluded ? (
        <Check size={14} className="text-emerald-400 shrink-0" />
      ) : (
        <X size={14} className="text-white/15 shrink-0" />
      )}
      <span className={`text-sm ${isIncluded ? 'text-white/70' : 'text-white/25'}`}>{label}</span>
    </div>
  );
}

export function PricingSection() {
  const { isAuthenticated } = useAuth();
  const [businessLoading, setBusinessLoading] = useState(false);

  const handleBusinessCheckout = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    setBusinessLoading(true);
    try {
      const data: { url: string } = await api.post('/payments/checkout', { plan: 'BUSINESS' });
      window.location.href = data.url;
    } catch {
      setBusinessLoading(false);
    }
  };

  return (
    <section id="preco" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Escolha seu <span className="gradient-text">plano</span>
          </h2>
          <p className="mt-4 text-white/50 max-w-2xl mx-auto">
            Comece gratis e faca upgrade quando precisar de mais recursos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* FREE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            className="glass-card p-6 sm:p-8 relative flex flex-col"
          >
            <div className="mb-6">
              <p className="text-sm text-white/50 font-semibold uppercase tracking-wider mb-3">Free</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-white">R$0</span>
              </div>
              <p className="text-sm text-white/40 mt-2">Gratis para sempre</p>
            </div>

            <div className="space-y-3 mb-8 flex-1">
              {features.map((f, i) => (
                <FeatureRow key={i} label={f.label} value={f.free} />
              ))}
            </div>

            <Link
              to={isAuthenticated ? '/editor' : '/login'}
              className="group w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-all"
            >
              Comecar gratis
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* PRO — Highlighted */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative flex flex-col"
          >
            {/* Gradient border effect */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-brand-cyan via-brand-magenta to-brand-purple opacity-60" />
            <div className="relative glass-card p-6 sm:p-8 flex flex-col flex-1 rounded-2xl">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold bg-gradient-to-r from-brand-cyan to-brand-magenta text-white px-2.5 py-0.5 rounded-full">
                  Mais popular
                </span>
                <span className="text-xs font-bold bg-white/10 text-brand-cyan px-2.5 py-0.5 rounded-full">
                  70% OFF
                </span>
              </div>

              <div className="mb-6">
                <p className="text-sm text-brand-cyan font-semibold uppercase tracking-wider mb-1">Pro</p>
                <p className="text-xs text-white/30 mb-3">Para profissionais individuais</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg text-white/30 line-through">R$99,90</span>
                  <span className="text-5xl font-extrabold gradient-text">R$30</span>
                  <span className="text-sm text-white/40">/ano</span>
                </div>
                <p className="text-sm text-white/40 mt-2">Menos de R$2,50 por mes</p>
              </div>

              <div className="space-y-3 mb-8 flex-1">
                {features.map((f, i) => (
                  <FeatureRow key={i} label={f.label} value={f.pro} />
                ))}
              </div>

              <Link
                to={isAuthenticated ? '/editor' : '/login'}
                className="group w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl gradient-bg text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-brand-cyan/20"
              >
                Assinar Pro
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* BUSINESS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 sm:p-8 relative flex flex-col"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold bg-white/10 text-brand-magenta px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <Building2 size={12} />
                Para empresas
              </span>
            </div>

            <div className="mb-6">
              <p className="text-sm text-brand-magenta font-semibold uppercase tracking-wider mb-3">Business</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-white">R$299</span>
                <span className="text-sm text-white/40">/ano</span>
              </div>
              <p className="text-sm text-white/40 mt-2">Ate 10 usuarios · ~R$24,92/mes</p>
            </div>

            <div className="space-y-3 mb-8 flex-1">
              {features.map((f, i) => (
                <FeatureRow key={i} label={f.label} value={f.business} />
              ))}
            </div>

            <button
              type="button"
              onClick={handleBusinessCheckout}
              disabled={businessLoading}
              className="group w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-brand-magenta/20 disabled:opacity-50"
            >
              {businessLoading ? 'Redirecionando...' : 'Assinar Business'}
              {!businessLoading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
