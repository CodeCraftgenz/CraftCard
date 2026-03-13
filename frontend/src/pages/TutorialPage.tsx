import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserCircle, Link2, Share2, ImageDown,
  Palette, ImageIcon, Briefcase, HelpCircle,
  CalendarDays, BarChart3, MessageSquare, FileText,
  Download, Building2, Users, Settings,
  Eye, Webhook, Sparkles, BookOpen, Copy,
  MapPin, Phone, QrCode, Video, Grid3X3,
  Clock, Smartphone, Mail, UserPlus, LayoutGrid,
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
    description: 'Personalize seu nome, bio, foto de perfil e foto de capa. Escolha um slug unico (ex: craftcardgenz.com/seu-nome).',
    link: '/editor',
  },
  {
    icon: <Link2 size={20} />,
    title: 'Adicione links e redes sociais',
    description: 'Conecte WhatsApp, Instagram, LinkedIn, TikTok, YouTube, email, telefone e qualquer link personalizado. Use separadores para organizar.',
    link: '/editor',
  },
  {
    icon: <Share2 size={20} />,
    title: 'Publique e compartilhe',
    description: 'Ative a publicacao do cartao, copie seu link e compartilhe nas redes sociais ou via QR Code personalizado.',
    link: '/editor',
  },
  {
    icon: <ImageDown size={20} />,
    title: 'Baixe como imagem',
    description: 'Exporte seu cartao como imagem PNG para usar em apresentacoes, curriculos ou materiais impressos.',
    link: '/editor',
  },
  {
    icon: <QrCode size={20} />,
    title: 'Pix no cartao',
    description: 'Adicione sua chave Pix como link. Visitantes veem um QR Code e podem copiar a chave ou o payload Copia e Cola.',
    link: '/editor',
  },
  {
    icon: <MapPin size={20} />,
    title: 'Mapa interativo',
    description: 'Adicione um endereco como link tipo "Mapa". Ele aparece como um mapa visual do Google Maps embutido no cartao.',
    link: '/editor',
  },
  {
    icon: <Phone size={20} />,
    title: 'Telefone direto',
    description: 'Adicione um link tipo "Telefone" com seu numero. Ao clicar, o visitante inicia a ligacao automaticamente.',
    link: '/editor',
  },
  {
    icon: <Clock size={20} />,
    title: 'Agendamento de links',
    description: 'Programe quando um link aparece no cartao. Defina data de inicio e fim — o link so fica visivel durante o periodo. Ideal para promocoes temporarias.',
    link: '/editor',
  },
];

const PRO_FEATURES: TutorialCard[] = [
  {
    icon: <Palette size={20} />,
    title: 'Personalize o visual',
    description: 'Escolha entre 10 temas, customize cores, fontes do Google Fonts, backgrounds com gradientes, imagens ou padroes. 6 estilos de icones: Neomorph, Glass, Gradiente e mais.',
    feature: 'customFonts',
    link: '/editor',
  },
  {
    icon: <LayoutGrid size={20} />,
    title: 'Layout Grid com tamanhos',
    description: 'Alterne entre lista e grid. No modo grid, escolha o tamanho de cada link: Pequeno, Wide, Banner, Alto ou Grande. Arraste para reordenar.',
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
    description: 'Configure seus horarios disponiveis e receba agendamentos diretamente pelo cartao. Gerencie tudo pelo editor.',
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
    icon: <Mail size={20} />,
    title: 'Formulario de contato',
    description: 'Receba mensagens diretamente pelo cartao. As mensagens aparecem no editor com notificacao.',
    feature: 'contacts',
    link: '/editor',
  },
  {
    icon: <FileText size={20} />,
    title: 'Curriculo e Video',
    description: 'Faca upload do seu curriculo em PDF e adicione um video de apresentacao. Embed de YouTube e Spotify tambem funciona nos links.',
    feature: 'resume',
    link: '/editor',
  },
  {
    icon: <Video size={20} />,
    title: 'Embeds de video e musica',
    description: 'Adicione links tipo "Video (YouTube)" ou "Musica (Spotify)". Eles abrem como players embutidos diretamente no cartao.',
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
    icon: <UserPlus size={20} />,
    title: 'Conexoes entre perfis',
    description: 'Conecte-se com outros usuarios do CraftCard. Visitantes logados podem enviar pedidos de conexao pelo botao no seu cartao. Gerencie na pagina de Conexoes.',
    link: '/connections',
  },
  {
    icon: <Copy size={20} />,
    title: 'Multiplos cartoes',
    description: 'Crie ate 3 cartoes pessoais (Pro). Use o seletor no topo do editor para alternar, criar ou excluir cartoes.',
    feature: 'canPublish',
    link: '/editor',
  },
  {
    icon: <Smartphone size={20} />,
    title: 'Preview mobile no editor',
    description: 'Veja como seu cartao aparece no celular em tempo real. O preview mostra um mockup de smartphone com todas as alteracoes.',
    feature: 'customFonts',
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
    description: 'Convide membros por email, defina roles (Admin/Membro) e gerencie permissoes. Ate 10 assentos por organizacao.',
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
  {
    icon: <Grid3X3 size={20} />,
    title: 'Widget embutivel',
    description: 'Gere um codigo HTML para embutir seu cartao em qualquer site. Configure tamanho e tema do widget.',
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
          {card.link === '/connections' ? 'Ir para Conexoes' : 'Ir para o editor'}
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

        {/* Tips section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={16} className="text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">Dicas</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.05] border border-white/10">
              <h3 className="text-sm font-semibold text-white mb-2">Tipos de links especiais</h3>
              <ul className="text-xs text-white/50 space-y-1.5 leading-relaxed">
                <li><span className="text-brand-cyan">Separador:</span> Cria um titulo visual para organizar seus links em secoes</li>
                <li><span className="text-brand-cyan">Pix:</span> Exibe QR Code + chave copiavel no cartao</li>
                <li><span className="text-brand-cyan">Mapa:</span> Mostra Google Maps embutido com seu endereco</li>
                <li><span className="text-brand-cyan">Telefone:</span> Inicia ligacao ao clicar</li>
                <li><span className="text-brand-cyan">Video:</span> Embed do YouTube com player inline</li>
                <li><span className="text-brand-cyan">Musica:</span> Embed do Spotify com player inline</li>
                <li><span className="text-brand-cyan">Arquivo:</span> Link com download automatico (PDF, etc)</li>
              </ul>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.05] border border-white/10">
              <h3 className="text-sm font-semibold text-white mb-2">Layout Grid</h3>
              <ul className="text-xs text-white/50 space-y-1.5 leading-relaxed">
                <li><span className="text-brand-cyan">Pequeno (1x1):</span> Icone quadrado compacto</li>
                <li><span className="text-brand-cyan">Wide (2x1):</span> Ocupa 2 colunas — ideal para links principais</li>
                <li><span className="text-brand-cyan">Banner (3x1):</span> Largura total — destaque maximo</li>
                <li><span className="text-brand-cyan">Alto (1x2):</span> Ocupa 2 linhas — bom para mapas</li>
                <li><span className="text-brand-cyan">Grande (2x2):</span> Bloco grande — perfeito para Pix ou video</li>
                <li className="pt-1 text-white/30">Arraste os links para reordenar. O grid preenche espacos automaticamente.</li>
              </ul>
            </div>
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
