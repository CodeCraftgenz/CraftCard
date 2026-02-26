import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserCircle, Link2, Share2, ImageDown,
  Palette, ImageIcon, Briefcase, HelpCircle,
  CalendarDays, BarChart3, MessageSquare, FileText,
  Download, Building2, Users, Settings,
  Eye, Webhook, Sparkles, BookOpen, Copy,
} from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import { UpgradeBanner } from '@/components/organisms/UpgradeBanner';
import { useAuth, type PlanLimits } from '@/providers/AuthProvider';
import type { ReactNode } from 'react';

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Gratuito',
  PRO: 'Pro',
  BUSINESS: 'Business',
  ENTERPRISE: 'Enterprise',
};

interface TutorialCard {
  icon: ReactNode;
  title: string;
  description: string;
  feature?: keyof PlanLimits;
  link?: string;
}

const GETTING_STARTED: TutorialCard[] = [
  {
    icon: <UserCircle size={20} />,
    title: 'Edite seu cartao',
    description: 'Personalize seu nome, bio, foto de perfil e escolha um slug unico para seu link.',
    link: '/editor',
  },
  {
    icon: <Link2 size={20} />,
    title: 'Adicione links',
    description: 'Conecte WhatsApp, Instagram, LinkedIn, email e qualquer link importante. Use headers para organizar e Pix para receber.',
    link: '/editor',
  },
  {
    icon: <Share2 size={20} />,
    title: 'Publique e compartilhe',
    description: 'Ative a publicacao do cartao, copie seu link e compartilhe nas redes sociais ou via QR Code.',
    link: '/editor',
  },
  {
    icon: <ImageDown size={20} />,
    title: 'Baixe como imagem',
    description: 'Exporte seu cartao como imagem PNG para usar em apresentacoes, curriculos ou materiais impressos.',
    link: '/editor',
  },
];

const PRO_FEATURES: TutorialCard[] = [
  {
    icon: <Palette size={20} />,
    title: 'Personalize o visual',
    description: 'Escolha entre 10 temas, customize cores, fontes do Google Fonts, backgrounds com gradientes ou padroes.',
    feature: 'customFonts',
    link: '/editor',
  },
  {
    icon: <ImageIcon size={20} />,
    title: 'Galeria de imagens',
    description: 'Faca upload de ate 10 fotos com legendas para mostrar seu trabalho, portfolio ou produtos.',
    feature: 'gallery',
    link: '/editor',
  },
  {
    icon: <Briefcase size={20} />,
    title: 'Tabela de servicos',
    description: 'Liste seus servicos com descricao e precos. Ideal para freelancers e profissionais liberais.',
    feature: 'services',
    link: '/editor',
  },
  {
    icon: <HelpCircle size={20} />,
    title: 'FAQ',
    description: 'Adicione perguntas frequentes ao cartao. O accordion aparece no cartao publico automaticamente.',
    feature: 'faq',
    link: '/editor',
  },
  {
    icon: <CalendarDays size={20} />,
    title: 'Agendamento online',
    description: 'Configure seus horarios disponiveis e receba agendamentos diretamente pelo cartao.',
    feature: 'bookings',
    link: '/editor',
  },
  {
    icon: <BarChart3 size={20} />,
    title: 'Analytics',
    description: 'Acompanhe visitas diarias, cliques nos links, dispositivos, origens do trafego e taxa de conversao.',
    feature: 'analytics',
    link: '/editor',
  },
  {
    icon: <MessageSquare size={20} />,
    title: 'Depoimentos',
    description: 'Receba e aprove depoimentos de clientes que aparecem no seu cartao publico.',
    feature: 'testimonials',
    link: '/editor',
  },
  {
    icon: <FileText size={20} />,
    title: 'Curriculo e Video',
    description: 'Faca upload do seu curriculo em PDF e adicione um video de apresentacao de ate 15 segundos.',
    feature: 'resume',
    link: '/editor',
  },
  {
    icon: <Download size={20} />,
    title: 'Exportar leads',
    description: 'Baixe todas as mensagens e contatos recebidos em formato CSV para usar no seu CRM.',
    feature: 'leadsExport',
    link: '/editor',
  },
  {
    icon: <Copy size={20} />,
    title: 'Multiplos cartoes',
    description: 'Crie ate 5 cartoes diferentes (Pro) ou 50 (Business). Use o seletor no topo do editor para alternar, criar ou excluir cartoes.',
    feature: 'canPublish',
    link: '/editor',
  },
];

const BUSINESS_FEATURES: TutorialCard[] = [
  {
    icon: <Building2 size={20} />,
    title: 'Dashboard da organizacao',
    description: 'Visao geral consolidada: total de visitas, mensagens, agendamentos e cartoes da equipe.',
    feature: 'orgDashboard',
  },
  {
    icon: <Users size={20} />,
    title: 'Gerenciar equipe',
    description: 'Convide membros por email, defina roles (Admin/Membro) e gerencie permissoes da organizacao.',
    feature: 'orgDashboard',
  },
  {
    icon: <Settings size={20} />,
    title: 'Branding centralizado',
    description: 'Defina cores, fontes e logo da empresa. O visual e aplicado automaticamente em todos os cartoes dos membros.',
    feature: 'branding',
  },
  {
    icon: <Eye size={20} />,
    title: 'Analytics consolidado',
    description: 'Veja as metricas de todos os cartoes da equipe em um unico painel, com breakdown por membro.',
    feature: 'orgDashboard',
  },
  {
    icon: <Webhook size={20} />,
    title: 'Webhooks e integracoes',
    description: 'Receba notificacoes em tempo real de novos contatos, agendamentos e visitas no seu sistema.',
    feature: 'webhooks',
  },
];

function TutorialCardComponent({ card, hasFeature, organizations }: {
  card: TutorialCard;
  hasFeature: (f: keyof PlanLimits) => boolean;
  organizations: Array<{ id: string }>;
}) {
  const isLocked = card.feature ? !hasFeature(card.feature) : false;
  const link = card.feature === 'orgDashboard' && organizations.length > 0
    ? `/org/${organizations[0].id}`
    : card.link || '/editor';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-2xl border transition-colors ${
        isLocked
          ? 'bg-white/[0.02] border-white/5'
          : 'bg-white/[0.05] border-white/10 hover:border-white/20'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
        isLocked ? 'bg-white/5 text-white/20' : 'bg-brand-cyan/10 text-brand-cyan'
      }`}>
        {card.icon}
      </div>
      <h3 className={`text-sm font-semibold mb-1.5 ${isLocked ? 'text-white/30' : 'text-white'}`}>
        {card.title}
      </h3>
      <p className={`text-xs leading-relaxed mb-3 ${isLocked ? 'text-white/20' : 'text-white/50'}`}>
        {card.description}
      </p>
      {isLocked && card.feature ? (
        <UpgradeBanner feature={card.feature} compact />
      ) : (
        <Link
          to={link}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-cyan hover:text-brand-cyan/80 transition-colors"
        >
          Ir para o editor
          <span aria-hidden>&rarr;</span>
        </Link>
      )}
    </motion.div>
  );
}

export function TutorialPage() {
  const { plan, hasFeature, organizations } = useAuth();

  const showPro = plan === 'PRO' || plan === 'BUSINESS' || plan === 'ENTERPRISE';
  const showEnterprise = plan === 'BUSINESS' || plan === 'ENTERPRISE';

  return (
    <div className="min-h-screen bg-brand-dark">
      <Header />
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center">
              <BookOpen size={20} className="text-brand-cyan" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Central de Ajuda</h1>
              <p className="text-sm text-white/40">
                Plano atual: <span className="text-brand-cyan font-medium">{PLAN_LABELS[plan] || plan}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={16} className="text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Primeiros Passos</h2>
            <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">Todos os planos</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {GETTING_STARTED.map((card) => (
              <TutorialCardComponent
                key={card.title}
                card={card}
                hasFeature={hasFeature}
                organizations={organizations}
              />
            ))}
          </div>
        </section>

        {/* Pro Features */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-1">
            <Palette size={16} className="text-brand-cyan" />
            <h2 className="text-lg font-semibold text-white">Recursos Pro</h2>
            {showPro ? (
              <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Ativo</span>
            ) : (
              <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">Requer upgrade</span>
            )}
          </div>
          <p className="text-xs text-white/30 mb-5 ml-7">Para profissionais individuais · R$30/ano</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRO_FEATURES.map((card) => (
              <TutorialCardComponent
                key={card.title}
                card={card}
                hasFeature={hasFeature}
                organizations={organizations}
              />
            ))}
          </div>
        </section>

        {/* Business / Enterprise Features */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={16} className="text-brand-magenta" />
            <h2 className="text-lg font-semibold text-white">Recursos Business</h2>
            {showEnterprise ? (
              <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Ativo</span>
            ) : (
              <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">Requer upgrade</span>
            )}
          </div>
          <p className="text-xs text-white/30 mb-5 ml-7">Inclui tudo do Pro + gestao de equipe e branding · R$189,90/ano</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BUSINESS_FEATURES.map((card) => (
              <TutorialCardComponent
                key={card.title}
                card={card}
                hasFeature={hasFeature}
                organizations={organizations}
              />
            ))}
          </div>
        </section>

        {/* Back to editor */}
        <div className="text-center">
          <Link
            to="/editor"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-cyan text-black text-sm font-semibold hover:bg-brand-cyan/90 transition-colors"
          >
            Voltar ao Editor
          </Link>
        </div>
      </div>
    </div>
  );
}
