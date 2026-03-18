/**
 * AboutPage.tsx — Pagina "Sobre Nos" do CraftCard.
 *
 * Secoes:
 * 1. Hero — Missao e subtitulo inspiracional
 * 2. Nossa Historia — Origem do projeto e hackathon
 * 3. Missao e Valores — 6 cards com icones
 * 4. O Que Fazemos — 4 features principais
 * 5. Nosso Impacto — Contadores animados (dados da API ou fallback)
 * 6. Nossa Tecnologia — Stack tecnica com checkmarks
 * 7. CTA — Chamada para registro
 *
 * Utiliza componentes reutilizaveis (Header, Footer, RevealSection, SectionDivider)
 * e framer-motion para animacoes de entrada.
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Target,
  Heart,
  Shield,
  Zap,
  Globe,
  Award,
  CreditCard,
  QrCode,
  BarChart3,
  Building2,
  Check,
  ArrowRight,
  Eye,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { RevealSection } from '@/components/atoms/RevealSection';
import { SectionDivider } from '@/components/atoms/SectionDivider';
import { api } from '@/lib/api';

// ─── Dados estaticos ──────────────────────────────────────────────

/** Cards de valores da empresa */
const VALUES = [
  {
    icon: Target,
    title: 'Foco na Missao',
    description: 'Cada decisao e guiada pelo objetivo de simplificar o networking profissional.',
  },
  {
    icon: Heart,
    title: 'Centrado no Usuario',
    description: 'Ouvimos nossos usuarios e construimos funcionalidades que realmente importam.',
  },
  {
    icon: Shield,
    title: 'Privacidade',
    description: 'Seus dados sao seus. Seguimos as melhores praticas de seguranca e LGPD.',
  },
  {
    icon: Zap,
    title: 'Inovacao',
    description: 'Tecnologia de ponta para entregar a melhor experiencia possivel.',
  },
  {
    icon: Globe,
    title: 'Sustentabilidade',
    description: 'Cartoes digitais = menos desperdicio de papel. Networking consciente.',
  },
  {
    icon: Award,
    title: 'Excelencia',
    description: 'Buscamos qualidade em cada pixel, cada linha de codigo, cada interacao.',
  },
];

/** Cards de funcionalidades principais */
const FEATURES = [
  {
    icon: CreditCard,
    title: 'Cartoes Digitais Inteligentes',
    description:
      'Crie cartoes profissionais personalizados com fotos, links, redes sociais e muito mais.',
  },
  {
    icon: QrCode,
    title: 'Compartilhamento via QR Code, Link e Widget',
    description:
      'Compartilhe seu cartao de diversas formas: QR Code, link direto ou widget embarcavel.',
  },
  {
    icon: BarChart3,
    title: 'Analytics e Insights em Tempo Real',
    description:
      'Acompanhe visualizacoes, cliques e interacoes com seu cartao em dashboards detalhados.',
  },
  {
    icon: Building2,
    title: 'Gestao B2B com Branding Corporativo',
    description:
      'Gerencie cartoes de toda a equipe com identidade visual da sua empresa.',
  },
];

/** Itens da stack tecnica */
const TECH_STACK = [
  'React + TypeScript (Frontend)',
  'NestJS + Prisma (Backend)',
  'Cloudflare R2 (Storage)',
  'Mercado Pago (Pagamentos)',
  'PWA + Service Worker',
  'Google OAuth + 2FA',
];

// ─── Contador animado (reutilizado da TrustedBySection) ───────────

function AnimatedCounter({
  end,
  suffix,
  decimals = 0,
  started,
}: {
  end: number;
  suffix: string;
  decimals?: number;
  started: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const startTime = performance.now();
    let raf: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * end);
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [started, end]);

  const display = decimals > 0 ? count.toFixed(decimals) : Math.round(count);
  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

/** Formata numero grande: 1500 → {end: 1.5, suffix: 'k+'} */
function formatLargeNumber(n: number): { end: number; suffix: string; decimals?: number } {
  if (n >= 1000) return { end: parseFloat((n / 1000).toFixed(1)), suffix: 'k+', decimals: 1 };
  return { end: n, suffix: '+' };
}

// ─── Variantes de animacao ────────────────────────────────────────

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Componente principal ─────────────────────────────────────────

export function AboutPage() {
  const impactRef = useRef<HTMLElement>(null);
  const [countersStarted, setCountersStarted] = useState(false);

  // Busca stats reais da API (mesmo endpoint da TrustedBySection)
  const { data: apiStats } = useQuery<{
    totalCards: number;
    totalViews: number;
    totalUsers: number;
  }>({
    queryKey: ['public-stats'],
    queryFn: () => api.get('/stats/public'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Stats com dados reais ou fallback
  const impactStats = apiStats
    ? [
        { icon: CreditCard, ...formatLargeNumber(apiStats.totalCards), label: 'Cartoes criados' },
        { icon: Eye, ...formatLargeNumber(apiStats.totalViews), label: 'Visualizacoes' },
        { icon: Users, ...formatLargeNumber(apiStats.totalUsers), label: 'Usuarios ativos' },
        { icon: Clock, end: 30, suffix: 's', label: 'Para criar seu cartao' },
      ]
    : [
        { icon: CreditCard, end: 500, suffix: '+', label: 'Cartoes criados' },
        { icon: Eye, end: 10, suffix: 'k+', label: 'Visualizacoes' },
        { icon: Users, end: 100, suffix: '+', label: 'Usuarios ativos' },
        { icon: Clock, end: 30, suffix: 's', label: 'Para criar seu cartao' },
      ];

  // Observer para iniciar contadores quando a secao de impacto ficar visivel
  useEffect(() => {
    if (!impactRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCountersStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(impactRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Helmet>
        <title>Sobre Nos — CraftCard | Cartoes Digitais Profissionais</title>
        <meta
          name="description"
          content="Conheca a CodeCraftGenZ, a empresa por tras do CraftCard. Nossa missao e revolucionar o networking profissional com cartoes digitais inteligentes."
        />
        <meta property="og:title" content="Sobre Nos — CraftCard" />
        <meta
          property="og:description"
          content="Conheca a CodeCraftGenZ e a plataforma CraftCard de cartoes digitais profissionais."
        />
        <meta property="og:url" content="https://craftcardgenz.com/about" />
        <meta property="og:type" content="website" />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-[#020617] text-white pt-16">
        {/* ═══════ 1. HERO ═══════ */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          {/* Gradiente decorativo de fundo */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-sm text-white/60 mb-6">
                <Sparkles size={14} className="text-indigo-400" />
                Desde 2024
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                Revolucionando o{' '}
                <span className="gradient-text">networking profissional</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
                O CraftCard nasceu com uma missao simples: tornar o compartilhamento de contatos
                profissionais mais inteligente, bonito e sustentavel.
              </p>
            </motion.div>
          </div>
        </section>

        <SectionDivider />

        {/* ═══════ 2. NOSSA HISTORIA ═══════ */}
        <RevealSection className="py-20 sm:py-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 sm:p-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6">
                Nossa <span className="gradient-text">Historia</span>
              </h2>
              <div className="space-y-4 text-white/60 leading-relaxed">
                <p>
                  A <strong className="text-white">CodeCraftGenZ</strong> foi fundada em 2024 com a
                  visao de transformar a forma como profissionais se conectam. Tudo comecou durante
                  um hackathon, onde percebemos que trocar cartoes de visita de papel era
                  ultrapassado, caro e nada sustentavel.
                </p>
                <p>
                  Dessa experiencia nasceu o <strong className="text-white">CraftCard</strong> — uma
                  plataforma SaaS que permite criar cartoes digitais profissionais em menos de 30
                  segundos, compartilhar via QR Code ou link e acompanhar metricas de engajamento em
                  tempo real.
                </p>
                <p>
                  Hoje, atendemos profissionais autonomos, startups e empresas que querem elevar seu
                  networking a um novo nivel — sem desperdicar papel e com muito mais estilo.
                </p>
              </div>
            </div>
          </div>
        </RevealSection>

        <SectionDivider />

        {/* ═══════ 3. MISSAO E VALORES ═══════ */}
        <RevealSection className="py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold">
                Missao e <span className="gradient-text">Valores</span>
              </h2>
              <p className="mt-4 text-white/50 max-w-xl mx-auto">
                Os principios que guiam cada decisao e cada linha de codigo que escrevemos.
              </p>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {VALUES.map((v) => (
                <motion.div
                  key={v.title}
                  variants={fadeUpItem}
                  className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.06] transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600/10 to-violet-600/10 flex items-center justify-center mb-4">
                    <v.icon size={20} className="text-indigo-400" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{v.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{v.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </RevealSection>

        <SectionDivider />

        {/* ═══════ 4. O QUE FAZEMOS ═══════ */}
        <RevealSection className="py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold">
                O Que <span className="gradient-text">Fazemos</span>
              </h2>
              <p className="mt-4 text-white/50 max-w-xl mx-auto">
                Uma plataforma completa para criar, compartilhar e gerenciar cartoes digitais
                profissionais.
              </p>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
              {FEATURES.map((f) => (
                <motion.div
                  key={f.title}
                  variants={fadeUpItem}
                  className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.06] transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600/10 to-violet-600/10 flex items-center justify-center mb-4">
                    <f.icon size={20} className="text-indigo-400" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{f.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </RevealSection>

        <SectionDivider />

        {/* ═══════ 5. NOSSO IMPACTO ═══════ */}
        <section ref={impactRef} className="py-20 sm:py-28">
          <RevealSection>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-14">
                <h2 className="text-2xl sm:text-3xl font-bold">
                  Nosso <span className="gradient-text">Impacto</span>
                </h2>
                <p className="mt-4 text-white/50 max-w-xl mx-auto">
                  Numeros que mostram o alcance da nossa plataforma.
                </p>
              </div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-50px' }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6"
              >
                {impactStats.map((s, i) => (
                  <motion.div key={i} variants={fadeUpItem} className="text-center p-6 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/[0.08] to-violet-600/[0.08] flex items-center justify-center mx-auto mb-4 group-hover:from-blue-600/[0.14] group-hover:to-violet-600/[0.14] transition-colors duration-300">
                      <s.icon size={22} className="text-indigo-400" />
                    </div>
                    <p className="font-heading text-3xl sm:text-4xl font-extrabold gradient-text tracking-tight">
                      <AnimatedCounter
                        end={s.end}
                        suffix={s.suffix}
                        decimals={s.decimals}
                        started={countersStarted}
                      />
                    </p>
                    <p className="text-sm text-white/40 mt-2">{s.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </RevealSection>
        </section>

        <SectionDivider />

        {/* ═══════ 6. NOSSA TECNOLOGIA ═══════ */}
        <RevealSection className="py-20 sm:py-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold">
                Nossa <span className="gradient-text">Tecnologia</span>
              </h2>
              <p className="mt-4 text-white/50 max-w-xl mx-auto">
                Construido com as melhores ferramentas do ecossistema moderno.
              </p>
            </div>

            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 sm:p-10">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {TECH_STACK.map((tech) => (
                  <motion.div
                    key={tech}
                    variants={fadeUpItem}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Check size={14} className="text-green-400" />
                    </div>
                    <span className="text-sm text-white/70">{tech}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </RevealSection>

        <SectionDivider />

        {/* ═══════ 7. CTA ═══════ */}
        <RevealSection className="py-20 sm:py-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Pronto para criar seu <span className="gradient-text">cartao</span>?
            </h2>
            <p className="text-white/50 mb-8 max-w-lg mx-auto">
              Junte-se a centenas de profissionais que ja transformaram seu networking com o
              CraftCard.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl gradient-bg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Comecar Agora — E Gratis
              <ArrowRight size={16} />
            </Link>
          </div>
        </RevealSection>
      </main>

      <Footer />
    </>
  );
}

export default AboutPage;
