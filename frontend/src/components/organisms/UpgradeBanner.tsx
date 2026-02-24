import { Sparkles } from 'lucide-react';
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
};

interface UpgradeBannerProps {
  feature?: keyof PlanLimits;
  compact?: boolean;
}

export function UpgradeBanner({ feature, compact }: UpgradeBannerProps) {
  const { plan } = useAuth();
  const [loading, setLoading] = useState(false);

  if (plan !== 'FREE') return null;

  const label = feature ? FEATURE_LABELS[feature] : null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const data: { url: string } = await api.post('/payments/checkout');
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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs hover:bg-brand-cyan/20 transition-colors"
      >
        <Sparkles size={12} />
        {loading ? 'Redirecionando...' : 'Fazer upgrade'}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center flex-shrink-0">
          <Sparkles size={16} className="text-brand-cyan" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">
            {label ? `${label} — disponivel no plano Pro` : 'Desbloqueie todas as funcionalidades'}
          </p>
          <p className="text-xs text-white/50 mt-0.5">
            Analytics, galeria, agendamento, servicos, fontes customizadas e muito mais por apenas R$30/ano.
          </p>
        </div>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-brand-cyan text-black text-xs font-semibold hover:bg-brand-cyan/90 transition-colors flex-shrink-0"
        >
          {loading ? '...' : 'Upgrade'}
        </button>
      </div>
    </div>
  );
}
