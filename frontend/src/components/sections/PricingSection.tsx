import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, Building2, Crown, Info, GraduationCap, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/lib/api';
import { usePublicSetting } from '@/hooks/useAdmin';

interface PlanFeature {
  label: string;
  hint?: string;
  free: boolean | string;
  pro: boolean | string;
  business: boolean | string;
  enterprise: boolean | string;
}

const features: PlanFeature[] = [
  { label: 'Cartões pessoais', free: '1', pro: '3', business: '3', enterprise: '3' },
  { label: 'Licenças (seats)', free: false, pro: '1', business: '5-100', enterprise: '101+' },
  { label: 'Botões de links no cartão', hint: 'Redes sociais e links personalizados exibidos no seu cartão digital', free: '5', pro: '20', business: '50', enterprise: '50' },
  { label: 'Temas visuais', free: '3', pro: 'Todos', business: 'Todos', enterprise: 'Todos' },
  { label: 'Conexões entre perfis', hint: 'Conecte-se com outros usuários e apareça na rede de contatos deles', free: '10', pro: '100', business: '500', enterprise: '1000' },
  { label: 'Analytics de visitas e cliques', free: false, pro: true, business: true, enterprise: true },
  { label: 'Galeria de fotos', free: false, pro: true, business: true, enterprise: true },
  { label: 'Agendamentos online', free: false, pro: true, business: true, enterprise: true },
  { label: 'Depoimentos', free: false, pro: true, business: true, enterprise: true },
  { label: 'Formulário de contato', hint: 'Receba mensagens diretamente pelo seu cartão digital', free: false, pro: true, business: true, enterprise: true },
  { label: 'Serviços e FAQ', free: false, pro: true, business: true, enterprise: true },
  { label: 'Currículo e video', free: false, pro: true, business: true, enterprise: true },
  { label: 'Fontes e fundos personalizados', hint: 'Fontes customizadas, imagens de fundo, gradientes e padrões', free: false, pro: true, business: true, enterprise: true },
  { label: 'Estilos de ícones', hint: 'Neomorph, Glass, Gradiente e outros estilos visuais para seus links', free: false, pro: true, business: true, enterprise: true },
  { label: 'Export de leads (CSV)', free: false, pro: true, business: true, enterprise: true },
  { label: 'Dashboard da organização', free: false, pro: false, business: true, enterprise: true },
  { label: 'Branding centralizado', hint: 'Aplique cores, fontes e logo da sua empresa em todos os cartões', free: false, pro: false, business: true, enterprise: true },
  { label: 'Webhooks e integrações', free: false, pro: false, business: true, enterprise: true },
  { label: 'Eventos', hint: 'Crie eventos para agrupar conexões por conferência ou encontro', free: false, pro: '3', business: '10', enterprise: 'Ilimitados' },
  { label: 'Mapa de conexões', hint: 'Visualize onde suas conexões foram feitas com geolocalização', free: false, pro: true, business: true, enterprise: true },
  { label: 'Tags de conexões', hint: 'Categorize conexões com etiquetas coloridas', free: false, pro: true, business: true, enterprise: true },
  { label: 'Wrapped anual', hint: 'Resumo anual das suas conexões estilo Spotify Wrapped', free: false, pro: true, business: true, enterprise: true },
  { label: 'CRM de Conexões', hint: 'Timeline, mapa, tags e wrapped anual dos seus contatos', free: false, pro: true, business: true, enterprise: true },
  { label: 'Integrações (Webhooks)', hint: 'RD Station, HubSpot, Salesforce, Zapier', free: false, pro: false, business: true, enterprise: true },
  { label: 'API Keys', hint: 'Bearer token para integração com seu ERP/sistema', free: false, pro: false, business: false, enterprise: true },
  { label: 'Domínio customizado', hint: 'Use o endereço da sua empresa, ex: cartões.suaempresa.com.br', free: false, pro: false, business: false, enterprise: true },
  { label: 'SLA 99.9% + Suporte VIP', free: false, pro: false, business: false, enterprise: true },
];

function FeatureRow({ label, hint, value, highlighted }: { label: string; hint?: string; value: boolean | string; highlighted?: boolean }) {
  const isIncluded = value === true || (typeof value === 'string' && value !== 'false');

  if (typeof value === 'string') {
    return (
      <div className="flex items-center gap-3">
        <Check size={14} className={highlighted ? 'text-indigo-300 shrink-0' : 'text-brand-indigo shrink-0'} />
        <span className={`text-sm flex-1 inline-flex items-center gap-1 ${highlighted ? 'text-white/80' : 'text-slate-400'}`}>
          {label}
          {hint && <span title={hint}><Info size={12} className={`shrink-0 cursor-help ${highlighted ? 'text-white/40' : 'text-slate-600'}`} /></span>}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${highlighted ? 'text-indigo-200 bg-white/10' : 'text-brand-indigo bg-brand-indigo/10'}`}>
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {isIncluded ? (
        <Check size={14} className={highlighted ? 'text-indigo-300 shrink-0' : 'text-brand-indigo shrink-0'} />
      ) : (
        <X size={14} className={highlighted ? 'text-white/20 shrink-0' : 'text-white/10 shrink-0'} />
      )}
      <span className={`text-sm inline-flex items-center gap-1 ${isIncluded ? (highlighted ? 'text-white/80' : 'text-slate-400') : (highlighted ? 'text-white/30' : 'text-slate-700')}`}>
        {label}
        {hint && <span title={hint}><Info size={12} className={`shrink-0 cursor-help ${highlighted ? 'text-white/40' : 'text-slate-600'}`} /></span>}
      </span>
    </div>
  );
}

export function PricingSection() {
  const { isAuthenticated } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
  const [businessSeats, setBusinessSeats] = useState(10);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [showSeatsModal, setShowSeatsModal] = useState(false);
  const { data: hackathonSetting } = usePublicSetting('hackathon_active');
  const isHackathonActive = hackathonSetting?.value === 'true';
  const visibleFeatures = showAllFeatures ? features : features.slice(0, 8);

  const isYearly = billingCycle === 'YEARLY';
  const proPrice = isYearly ? 15.9 : 19.9;

  // Tiered pricing for BUSINESS — 5 to 100 seats
  const getBusinessTierPrice = (seats: number): number => {
    if (seats <= 10) return 39.9;
    if (seats <= 25) return 34.9;
    if (seats <= 50) return 29.9;
    return 22.9; // 51-100
  };
  const businessBasePricePerSeat = getBusinessTierPrice(businessSeats);
  const businessPricePerSeat = isYearly ? Math.round(businessBasePricePerSeat * 0.8 * 100) / 100 : businessBasePricePerSeat;
  const businessTotal = Math.round(businessPricePerSeat * businessSeats * 100) / 100;
  const businessSavingsPercent = Math.round((1 - businessPricePerSeat / 39.9) * 100);

  const handleCheckout = async (plan: 'PRO' | 'BUSINESS') => {
    const seats = plan === 'BUSINESS' ? businessSeats : 1;
    const params = `plan=${plan}&seats=${seats}&cycle=${billingCycle}`;

    if (!isAuthenticated) {
      // Redirect to register with checkout intent preserved in URL
      window.location.href = `/register?${params}&redirect=/billing`;
      return;
    }
    setLoadingPlan(plan);
    try {
      const data: { url: string } = await api.post('/payments/checkout', {
        plan,
        billingCycle,
        seatsCount: seats,
      });
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
          {/* Billing cycle toggle */}
          <div className="mt-6 inline-flex items-center gap-3 p-1 rounded-full bg-white/[0.06] border border-white/10">
            <button
              type="button"
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                !isYearly ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                isYearly ? 'bg-brand-cyan/20 text-brand-cyan shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Anual
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">-20%</span>
            </button>
          </div>

          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Comece grátis e faça upgrade quando precisar de mais recursos
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
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
              <p className="text-sm text-slate-600 mt-2">Grátis para sempre</p>
            </div>

            <div className="space-y-2.5 mb-8 flex-1">
              {visibleFeatures.map((f, i) => (
                <FeatureRow key={i} label={f.label} hint={f.hint} value={f.free} />
              ))}
            </div>

            <Link
              to={isAuthenticated ? '/editor' : '/login'}
              className="group w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/[0.10] text-white font-semibold hover:bg-white/[0.04] transition-all duration-250 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              Comecar grátis
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
                <p className="text-sm text-indigo-300 font-semibold uppercase tracking-wider mb-1">Pro</p>
                <p className="text-xs text-white/50 mb-3">Para profissionais individuais</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-base text-white/40 line-through">R$29,90</span>
                  <span className="font-heading text-4xl font-extrabold gradient-text">R${proPrice.toFixed(2).replace('.', ',')}</span>
                  <span className="text-sm text-white/50">/mês</span>
                </div>
                {isYearly ? (
                  <p className="text-sm mt-2">
                    <span className="text-emerald-400 font-semibold">Economize R${((29.9 - proPrice) * 12).toFixed(0)}/ano</span>
                    <span className="text-white/30"> · R${(proPrice * 12).toFixed(2).replace('.', ',')} cobrado anualmente</span>
                  </p>
                ) : (
                  <p className="text-sm text-white/40 mt-2">
                    <span className="text-amber-400 font-medium">33% OFF</span> — de R$29,90 por R$19,90
                  </p>
                )}
              </div>

              <div className="space-y-2.5 mb-8 flex-1">
                {visibleFeatures.map((f, i) => (
                  <FeatureRow key={i} label={f.label} hint={f.hint} value={f.pro} highlighted />
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleCheckout('PRO')}
                disabled={loadingPlan === 'PRO'}
                className="btn-glossy btn-glow-hover group/btn w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl gradient-bg text-white font-semibold transition-all shadow-lg shadow-indigo-500/20 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 disabled:opacity-50"
              >
                {loadingPlan === 'PRO' ? 'Redirecionando...' : 'Assinar Pro'}
                {loadingPlan !== 'PRO' && <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform duration-200" />}
              </button>
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
                Para equipes
              </span>
            </div>

            <div className="mb-6">
              <p className="text-sm text-indigo-400 font-semibold uppercase tracking-wider mb-1">Business</p>
              <p className="text-xs text-slate-600 mb-3">Gestão de equipe centralizada</p>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-sm text-white/40 line-through">R$49,90</span>
                <span className="font-heading text-3xl sm:text-4xl font-extrabold text-white">R${(isYearly ? Math.round(22.9 * 0.8 * 100) / 100 : 22.9).toFixed(2).replace('.', ',')}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">a partir de /mês por seat · 5 a 100 membros</p>
              <p className="text-xs mt-1">
                <span className="text-emerald-400 font-semibold">Até 43% OFF por volume</span>
                {isYearly && <span className="text-white/30"> + 20% desconto anual</span>}
              </p>
            </div>

            <div className="space-y-2.5 mb-8 flex-1">
              {visibleFeatures.map((f, i) => (
                <FeatureRow key={i} label={f.label} hint={f.hint} value={f.business} />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowSeatsModal(true)}
              className="btn-glossy btn-glow-hover group w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl gradient-bg text-white font-semibold transition-all shadow-lg shadow-indigo-500/20 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
            >
              Assinar Business
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
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
                <p className="text-xs text-slate-600 mb-3">+100 colaboradores · vendas complexas</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-3xl font-extrabold text-white">Sob Consulta</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">Preço personalizado para sua empresa</p>
              </div>

              <div className="space-y-2.5 mb-8 flex-1">
                {visibleFeatures.map((f, i) => (
                  <FeatureRow key={i} label={f.label} hint={f.hint} value={f.enterprise} />
                ))}
              </div>

              <a
                href="https://wa.me/5535999358856?text=Olá! Tenho interesse no plano Enterprise do CraftCard para minha empresa. Gostaria de saber mais sobre preços e funcionalidades. 🚀"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glossy btn-glow-hover group w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl gradient-bg text-white font-semibold transition-all shadow-lg shadow-violet-600/25 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50"
              >
                Falar com Vendas
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
              </a>
            </div>
          </motion.div>
        </div>

        {/* Expand/collapse features */}
        {features.length > 8 && (
          <div className="flex justify-center mt-4">
            <button
              type="button"
              onClick={() => setShowAllFeatures(!showAllFeatures)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition flex items-center gap-1"
            >
              {showAllFeatures ? 'Ver menos recursos ↑' : `Ver todos os ${features.length} recursos ↓`}
            </button>
          </div>
        )}

        {/* HACKATHON SENAC — Special Event Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-10 max-w-2xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #004B87, #F37021)' }}>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvc3ZnPg==')] opacity-50" />
            <div className="relative p-8 flex flex-col sm:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                <GraduationCap size={32} className="text-white" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h3 className="font-heading text-xl font-bold text-white">Hackathon Senac</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isHackathonActive ? 'bg-emerald-500/30 text-emerald-200' : 'bg-white/20 text-white'}`}>
                    {isHackathonActive ? 'INSCRICOES ABERTAS' : 'EVENTO'}
                  </span>
                </div>
                <p className="text-white/80 text-sm mb-1">Cracha digital + networking + formação de equipes</p>
                <p className="text-white/50 text-xs">2 dias de imersão com cartão digital exclusivo, QR Code para conexões e match de habilidades entre participantes.</p>
              </div>
              {isHackathonActive ? (
                <Link
                  to="/hackathon"
                  className="shrink-0 px-6 py-3 rounded-xl bg-white/25 backdrop-blur-sm text-white font-semibold text-sm border border-white/30 hover:bg-white/35 transition-all"
                >
                  Participar agora
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="shrink-0 px-6 py-3 rounded-xl bg-white/20 backdrop-blur-sm text-white font-semibold text-sm cursor-not-allowed opacity-70 border border-white/20"
                >
                  Disponível em breve
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Business Seats Modal */}
      {showSeatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowSeatsModal(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0f0f23] border border-white/10 rounded-3xl p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white mb-1">Plano Business</h3>
            <p className="text-sm text-white/40 mb-5">Escolha o número de colaboradores da sua equipe</p>

            {/* Seats selector */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-indigo-400" />
                  <span className="text-xl font-bold text-white">{businessSeats}</span>
                  <span className="text-sm text-white/40">membros</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-white">R${businessTotal.toFixed(2).replace('.', ',')}</span>
                  <span className="text-xs text-white/40">/mês</span>
                </div>
              </div>

              <input
                type="range"
                min={5}
                max={100}
                value={businessSeats}
                onChange={(e) => setBusinessSeats(Number(e.target.value))}
                className="w-full h-2.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
                title="Número de colaboradores"
              />

              {/* Tier breakdown */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { range: '5-10', price: 39.9, active: businessSeats <= 10 },
                  { range: '11-25', price: 34.9, active: businessSeats > 10 && businessSeats <= 25 },
                  { range: '26-50', price: 29.9, active: businessSeats > 25 && businessSeats <= 50 },
                  { range: '51-100', price: 22.9, active: businessSeats > 50 },
                ].map((tier) => (
                  <div
                    key={tier.range}
                    className={`text-center py-2 rounded-lg border transition-all ${
                      tier.active
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                        : 'border-white/5 text-white/30'
                    }`}
                  >
                    <p className="text-[10px] font-semibold">{tier.range}</p>
                    <p className="text-xs font-bold">R${tier.price.toFixed(2).replace('.', ',')}</p>
                    <p className="text-[8px] opacity-60">/seat</p>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <p className="text-xs text-white/30">
                  R${businessPricePerSeat.toFixed(2).replace('.', ',')} × {businessSeats} membros
                  {isYearly && ' × 12 meses × 0.8 (desconto anual)'}
                </p>
                {businessSavingsPercent > 0 && (
                  <p className="text-xs text-emerald-400 font-semibold mt-1">
                    {businessSavingsPercent}% de desconto por volume{isYearly ? ' + 20% anual' : ''}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => { setShowSeatsModal(false); handleCheckout('BUSINESS'); }}
                disabled={loadingPlan === 'BUSINESS'}
                className="w-full py-3 rounded-xl gradient-bg text-white font-semibold text-sm transition-all hover:brightness-110 disabled:opacity-50"
              >
                {loadingPlan === 'BUSINESS' ? 'Redirecionando...' : `Assinar Business — R$${businessTotal.toFixed(2).replace('.', ',')}/mês`}
              </button>

              <p className="text-center text-[10px] text-white/20">
                Precisa de mais de 100 membros? <a href="https://wa.me/5535999358856?text=Olá! Preciso do plano Enterprise para mais de 100 colaboradores. Podem me ajudar? 🏢" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Fale com vendas</a>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
