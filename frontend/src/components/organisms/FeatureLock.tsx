import { Lock } from 'lucide-react';
import { useAuth, type PlanLimits } from '@/providers/AuthProvider';
import { UpgradeBanner } from './UpgradeBanner';
import type { ReactNode } from 'react';

const FEATURE_NAMES: Partial<Record<keyof PlanLimits, string>> = {
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

interface FeatureLockProps {
  feature: keyof PlanLimits;
  children: ReactNode;
  /** If true, completely hide the section instead of showing lock overlay */
  hide?: boolean;
}

export function FeatureLock({ feature, children, hide }: FeatureLockProps) {
  const { hasFeature } = useAuth();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (hide) return null;

  const label = FEATURE_NAMES[feature] || 'Este recurso';

  return (
    <div className="glass-card p-6 hover:border-white/20 transition-colors">
      <div className="flex flex-col items-center justify-center py-4 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center">
          <Lock size={20} className="text-white/40" />
        </div>
        <div>
          <p className="text-sm font-medium text-white/70">
            {label}
          </p>
          <p className="text-xs text-white/30 mt-1">
            Funcionalidade exclusiva para assinantes
          </p>
        </div>
        <div className="mt-1">
          <UpgradeBanner feature={feature} compact />
        </div>
      </div>
    </div>
  );
}
