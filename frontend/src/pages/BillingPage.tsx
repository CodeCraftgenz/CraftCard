import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Crown, Check, Loader2 } from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import { useBillingInfo, useCheckout } from '@/hooks/useBilling';

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-white/10 text-white/60',
  PRO: 'bg-blue-500/20 text-blue-400',
  BUSINESS: 'bg-purple-500/20 text-purple-400',
  ENTERPRISE: 'bg-amber-500/20 text-amber-400',
};

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  rejected: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-white/10 text-white/40',
  refunded: 'bg-orange-500/20 text-orange-400',
};

const PLAN_FEATURES: Record<string, string[]> = {
  FREE: ['1 cartao', '5 links', '3 temas', 'Marca dagua'],
  PRO: ['5 cartoes', '20 links', 'Todos temas', 'Analytics', 'Sem marca dagua', 'Fontes personalizadas'],
  BUSINESS: ['50 cartoes', '50 links', 'Dashboard org', 'Branding', 'Webhooks', 'Export leads'],
  ENTERPRISE: ['Todos recursos', 'Dominio customizado', 'Suporte prioritario'],
};

export function BillingPage() {
  const { data: billing, isLoading } = useBillingInfo();
  const checkout = useCheckout();

  if (isLoading || !billing) {
    return (
      <div className="min-h-screen bg-brand-dark">
        <Header />
        <div className="flex items-center justify-center h-[60vh] pt-20">
          <div className="animate-pulse text-white/50">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <Header />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-8">
        <Link
          to="/editor"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Voltar ao Editor
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <CreditCard size={28} className="text-brand-cyan" />
          <h1 className="text-2xl font-bold text-white">Meu Plano</h1>
        </div>

        {/* Current plan */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-xl text-sm font-bold ${PLAN_COLORS[billing.plan] || PLAN_COLORS.FREE}`}>
                {billing.plan}
              </span>
              {billing.plan === 'ENTERPRISE' && <Crown size={16} className="text-amber-400" />}
            </div>
            {billing.expiresAt && (
              <span className="text-white/40 text-sm">
                Expira em {new Date(billing.expiresAt).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>

          {/* Days remaining bar */}
          {billing.daysRemaining !== null && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>{billing.daysRemaining} dias restantes</span>
                <span>365 dias</span>
              </div>
              <div className="bg-white/5 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    billing.daysRemaining <= 30 ? 'bg-red-500' : 'bg-brand-cyan'
                  }`}
                  style={{ width: `${Math.min(100, (billing.daysRemaining / 365) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {billing.plan === 'FREE' && !billing.expiresAt && (
            <p className="text-white/40 text-sm">Plano gratuito — sem data de expiracao</p>
          )}

          {billing.expiresAt === null && billing.plan !== 'FREE' && (
            <p className="text-white/40 text-sm">Acesso vitalicio</p>
          )}

          {/* Features */}
          <div className="mt-4 flex flex-wrap gap-2">
            {(PLAN_FEATURES[billing.plan] || PLAN_FEATURES.FREE).map((f) => (
              <span key={f} className="flex items-center gap-1 text-xs text-white/50 bg-white/5 px-2 py-1 rounded-lg">
                <Check size={10} className="text-brand-cyan" />
                {f}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Upgrade / Renew */}
        {(billing.canUpgrade || billing.canRenew) && (
          <div className="mb-6">
            <h2 className="text-white font-semibold mb-4">
              {billing.canRenew ? 'Renovar Assinatura' : 'Fazer Upgrade'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {billing.canUpgrade && billing.plan === 'FREE' && (
                <>
                  <PlanCard
                    name="PRO"
                    price="R$ 30"
                    period="/ano"
                    features={['3 cartoes', '20 links', 'Todos temas', 'Analytics', 'Sem marca dagua']}
                    onSelect={() => checkout.mutate({ plan: 'PRO' })}
                    loading={checkout.isPending}
                  />
                  <PlanCard
                    name="BUSINESS"
                    price="R$ 189,90"
                    period="/ano"
                    features={['Ate 10 membros', '50 links', 'Dashboard org', 'Branding', 'Webhooks']}
                    onSelect={() => checkout.mutate({ plan: 'BUSINESS' })}
                    loading={checkout.isPending}
                    highlight
                  />
                </>
              )}
              {billing.canUpgrade && billing.plan === 'PRO' && (
                <PlanCard
                  name="BUSINESS"
                  price="R$ 189,90"
                  period="/ano"
                  features={['Ate 10 membros', '50 links', 'Dashboard org', 'Branding', 'Webhooks']}
                  onSelect={() => checkout.mutate({ plan: 'BUSINESS' })}
                  loading={checkout.isPending}
                  highlight
                />
              )}
              {billing.canRenew && (
                <PlanCard
                  name={billing.plan}
                  price={billing.plan === 'PRO' ? 'R$ 30' : 'R$ 189,90'}
                  period="/ano"
                  features={['Renovar por mais 1 ano']}
                  onSelect={() => checkout.mutate({ plan: billing.plan })}
                  loading={checkout.isPending}
                  cta="Renovar"
                />
              )}
            </div>
          </div>
        )}

        {/* Payment history */}
        <div>
          <h2 className="text-white font-semibold mb-4">Historico de Pagamentos</h2>
          {billing.payments.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center text-white/30 text-sm">
              Nenhum pagamento encontrado
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/5">
              {billing.payments.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1">
                    <span className="text-white text-sm font-medium">
                      {p.plan || 'Pagamento'}
                    </span>
                    <p className="text-white/40 text-xs">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString('pt-BR') : new Date(p.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className="text-white/70 text-sm font-mono">R$ {p.amount.toFixed(2)}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS_COLORS[p.status] || STATUS_COLORS.pending}`}>
                    {p.status}
                  </span>
                  {p.expiresAt && (
                    <span className="text-white/30 text-xs hidden md:block">
                      ate {new Date(p.expiresAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  name, price, period, features, onSelect, loading, highlight, cta,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  onSelect: () => void;
  loading: boolean;
  highlight?: boolean;
  cta?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-5 border ${
        highlight
          ? 'bg-brand-cyan/5 border-brand-cyan/30'
          : 'bg-white/5 border-white/10'
      }`}
    >
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-2xl font-bold text-white">{price}</span>
        <span className="text-white/40 text-sm">{period}</span>
      </div>
      <p className={`text-sm font-semibold mb-3 ${highlight ? 'text-brand-cyan' : 'text-white/70'}`}>
        {name}
      </p>
      <ul className="space-y-1.5 mb-4">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-white/50">
            <Check size={12} className="text-brand-cyan flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onSelect}
        disabled={loading}
        className={`w-full py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
          highlight
            ? 'bg-brand-cyan text-brand-dark hover:bg-brand-cyan/90'
            : 'bg-white/10 text-white hover:bg-white/15'
        }`}
      >
        {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : (cta || `Assinar ${name}`)}
      </button>
    </motion.div>
  );
}
