import { Sparkles, Building2, Crown } from 'lucide-react';
import { useAuth, type PlanLimits } from '@/providers/AuthProvider';
import { api } from '@/lib/api';
import { useState } from 'react';

const FEATURE_LABELS: Partial<Record<keyof PlanLimits, string>> = {
  analytics: 'Analytics detalhados',
  gallery: 'Galeria de imagens',
  bookings: 'Agendamento online',
  testimonials: 'Depoimentos',
  contacts: 'Mensagens de contato',
  services: 'Tabela de servicos',
  faq: 'FAQ',
  resume: 'Upload de curriculo',
  video: 'Video de apresentacao',
  customFonts: 'Fontes customizadas',
  customBg: 'Fundos personalizados',
  leadsExport: 'Exportar leads (CSV)',
  orgDashboard: 'Dashboard da organizacao',
  branding: 'Branding centralizado',
  customDomain: 'Dominio customizado',
  webhooks: 'Webhooks e integracoes',
};

interface UpsellConfig {
  targetPlan: 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  icon: typeof Sparkles;
  title: string;
  description: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  btnClass: string;
}

const UPSELL_BY_PLAN: Record<string, UpsellConfig> = {
  FREE: {
    targetPlan: 'PRO',
    icon: Sparkles,
    title: 'Precisa de mais cartoes para os seus diferentes negocios?',
    description: 'Faca upgrade para o Pro — ate 3 cartoes, analytics, galeria, agendamento e muito mais por apenas R$30/ano.',
    accentColor: 'text-brand-cyan',
    bgColor: 'bg-brand-cyan/5',
    borderColor: 'border-brand-cyan/20',
    btnClass: 'bg-brand-cyan text-black hover:bg-brand-cyan/90',
  },
  PRO: {
    targetPlan: 'BUSINESS',
    icon: Building2,
    title: 'Tem uma equipa? Gira todos os cartoes num so lugar.',
    description: 'Conheca o plano Business — dashboard de organizacao, branding centralizado e webhooks por R$189,90/ano.',
    accentColor: 'text-brand-magenta',
    bgColor: 'bg-brand-magenta/5',
    borderColor: 'border-brand-magenta/20',
    btnClass: 'bg-gradient-to-r from-brand-magenta to-brand-purple text-white hover:opacity-90',
  },
  BUSINESS: {
    targetPlan: 'ENTERPRISE',
    icon: Crown,
    title: 'Destaque a sua marca com dominio customizado.',
    description: 'Faca upgrade para o Enterprise — dominio proprio (suaempresa.com) por R$299,90/ano.',
    accentColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/5',
    borderColor: 'border-yellow-500/20',
    btnClass: 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:opacity-90',
  },
};

interface UpgradeBannerProps {
  feature?: keyof PlanLimits;
  compact?: boolean;
}

export function UpgradeBanner({ feature, compact }: UpgradeBannerProps) {
  const { plan } = useAuth();
  const [loading, setLoading] = useState(false);

  const config = UPSELL_BY_PLAN[plan];
  if (!config) return null; // ENTERPRISE — no upsell

  const featureLabel = feature ? FEATURE_LABELS[feature] : null;
  const Icon = config.icon;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const data: { url: string } = await api.post('/payments/checkout', { plan: config.targetPlan });
      window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${config.bgColor} ${config.borderColor} border ${config.accentColor} text-xs hover:opacity-80 transition-colors`}
      >
        <Icon size={12} />
        {loading ? 'Redirecionando...' : `Upgrade ${config.targetPlan}`}
      </button>
    );
  }

  return (
    <div className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
          <Icon size={16} className={config.accentColor} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">
            {featureLabel ? `${featureLabel} — disponivel no plano ${config.targetPlan}` : config.title}
          </p>
          <p className="text-xs text-white/50 mt-0.5">
            {config.description}
          </p>
        </div>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${config.btnClass}`}
        >
          {loading ? '...' : 'Upgrade'}
        </button>
      </div>
    </div>
  );
}
