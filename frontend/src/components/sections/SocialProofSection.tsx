import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    name: 'Maria Silva',
    role: 'Designer Freelancer',
    text: 'O CraftCard transformou a forma como compartilho meus contatos. Profissional e elegante!',
  },
  {
    name: 'Pedro Santos',
    role: 'Consultor de TI',
    text: 'Meus clientes sempre elogiam meu cartao digital. O QR code e um diferencial em eventos.',
  },
  {
    name: 'Ana Oliveira',
    role: 'CEO - Studio Criativo',
    text: 'Usamos o plano Business para toda a equipe. A gestao centralizada e excelente.',
  },
  {
    name: 'Rafael Costa',
    role: 'Corretor de Imoveis',
    text: 'Desde que comecei a usar o CraftCard, minha taxa de contatos aumentou 40%. Impressionante!',
  },
  {
    name: 'Juliana Mendes',
    role: 'Fotografa Profissional',
    text: 'A galeria integrada no cartao e perfeita para mostrar meu portfolio. Clientes adoram!',
  },
  {
    name: 'Carlos Eduardo',
    role: 'Advogado',
    text: 'Substituiu meu cartao de visita tradicional. Muito mais pratico e sempre atualizado.',
  },
  {
    name: 'Fernanda Lima',
    role: 'Marketing Digital',
    text: 'O analytics me mostra exatamente quem visualizou meu cartao. Dados valiosos para networking.',
  },
  {
    name: 'Lucas Almeida',
    role: 'Startup Founder',
    text: 'Toda a equipe usa o plano Business. O branding unificado passa muita credibilidade.',
  },
  {
    name: 'Beatriz Rocha',
    role: 'Nutricionista',
    text: 'Meus pacientes agendam consultas direto pelo cartao. Simples, rapido e funcional.',
  },
];

const CARDS_PER_VIEW = 3;
const TOTAL_PAGES = Math.ceil(testimonials.length / CARDS_PER_VIEW);
const AUTO_PLAY_INTERVAL = 5000;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

export function SocialProofSection() {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);

  const paginate = useCallback(
    (newDirection: number) => {
      setDirection(newDirection);
      setPage((prev) => {
        const next = prev + newDirection;
        if (next < 0) return TOTAL_PAGES - 1;
        if (next >= TOTAL_PAGES) return 0;
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    const timer = setInterval(() => paginate(1), AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [paginate]);

  const visibleCards = testimonials.slice(
    page * CARDS_PER_VIEW,
    page * CARDS_PER_VIEW + CARDS_PER_VIEW,
  );

  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
            O que nossos <span className="gradient-text">usuarios</span> dizem
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Profissionais e empresas que ja transformaram sua presenca digital
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation arrows */}
          <button
            type="button"
            onClick={() => paginate(-1)}
            className="absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:bg-white/[0.08] hover:text-white transition-all duration-200"
            aria-label="Depoimentos anteriores"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => paginate(1)}
            className="absolute -right-4 sm:-right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:bg-white/[0.08] hover:text-white transition-all duration-200"
            aria-label="Proximos depoimentos"
          >
            <ChevronRight size={18} />
          </button>

          {/* Cards container */}
          <div className="overflow-hidden px-2">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={page}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {visibleCards.map((t, i) => (
                  <div
                    key={`${page}-${i}`}
                    className="glass-card-hover p-6 relative"
                  >
                    <Quote size={24} className="text-indigo-500/15 absolute top-4 right-4" />
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} size={14} className="text-indigo-400 fill-indigo-400" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed mb-4">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold">
                        {t.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{t.name}</p>
                        <p className="text-xs text-slate-500">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots pagination */}
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => {
                  setDirection(i > page ? 1 : -1);
                  setPage(i);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === page
                    ? 'w-6 bg-brand-indigo'
                    : 'w-2 bg-white/[0.12] hover:bg-white/[0.20]'
                }`}
                aria-label={`Pagina ${i + 1} de depoimentos`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
