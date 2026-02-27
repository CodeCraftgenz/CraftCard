import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Template {
  name: string;
  gradient: string;
  accent: string;
  textColor: string;
  avatarBg: string;
}

const templates: Template[] = [
  {
    name: 'Minimal',
    gradient: 'from-slate-900 to-slate-800',
    accent: 'bg-white/20',
    textColor: 'text-white',
    avatarBg: 'bg-slate-700',
  },
  {
    name: 'Indigo Pro',
    gradient: 'from-indigo-950 to-indigo-900',
    accent: 'bg-indigo-500/30',
    textColor: 'text-indigo-100',
    avatarBg: 'bg-indigo-800',
  },
  {
    name: 'Gradient',
    gradient: 'from-blue-600 to-violet-600',
    accent: 'bg-white/20',
    textColor: 'text-white',
    avatarBg: 'bg-white/20',
  },
  {
    name: 'Neon',
    gradient: 'from-gray-950 to-gray-900',
    accent: 'bg-emerald-500/30',
    textColor: 'text-emerald-100',
    avatarBg: 'bg-emerald-900',
  },
  {
    name: 'Sunset',
    gradient: 'from-orange-950 to-rose-950',
    accent: 'bg-orange-500/20',
    textColor: 'text-orange-100',
    avatarBg: 'bg-orange-800',
  },
  {
    name: 'Corporate',
    gradient: 'from-slate-950 to-blue-950',
    accent: 'bg-amber-500/20',
    textColor: 'text-amber-100',
    avatarBg: 'bg-slate-800',
  },
];

function MiniCard({ t, index }: { t: Template; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="shrink-0 w-[220px] sm:w-[240px] group"
    >
      <div
        className={`relative h-[310px] sm:h-[340px] rounded-2xl bg-gradient-to-br ${t.gradient} border border-white/[0.06] overflow-hidden transition-all duration-300 group-hover:border-white/[0.14] group-hover:shadow-xl group-hover:shadow-indigo-500/[0.06] group-hover:-translate-y-1`}
      >
        {/* Mock card content */}
        <div className="p-5 flex flex-col items-center text-center h-full">
          {/* Avatar */}
          <div className={`w-16 h-16 rounded-full ${t.avatarBg} mt-4 mb-3 flex items-center justify-center`}>
            <div className="w-8 h-8 rounded-full bg-white/10" />
          </div>

          {/* Name placeholder */}
          <div className={`h-3 w-24 rounded-full ${t.accent} mb-2`} />
          <div className={`h-2 w-16 rounded-full ${t.accent} opacity-60 mb-5`} />

          {/* Bio placeholder */}
          <div className="space-y-1.5 w-full mb-5">
            <div className={`h-1.5 w-full rounded-full ${t.accent} opacity-30`} />
            <div className={`h-1.5 w-4/5 rounded-full ${t.accent} opacity-30 mx-auto`} />
          </div>

          {/* Social icons placeholder */}
          <div className="flex gap-2 mb-5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className={`w-7 h-7 rounded-lg ${t.accent} opacity-40`} />
            ))}
          </div>

          {/* Link buttons placeholder */}
          <div className="w-full space-y-2 mt-auto">
            <div className={`h-8 w-full rounded-lg ${t.accent}`} />
            <div className={`h-8 w-full rounded-lg ${t.accent} opacity-60`} />
          </div>
        </div>
      </div>

      {/* Template name */}
      <p className={`text-center text-sm font-medium mt-3 ${t.textColor} opacity-70 group-hover:opacity-100 transition-opacity`}>
        {t.name}
      </p>
    </motion.div>
  );
}

export function TemplateGallerySection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 260;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45 }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
            Templates <span className="gradient-text-animated">profissionais</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Escolha entre diversos estilos e personalize ao seu gosto
          </p>
        </motion.div>

        {/* Navigation arrows — desktop only */}
        <div className="hidden md:flex justify-end gap-2 mb-6">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.06] transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft size={16} className="text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.06] transition-colors"
            aria-label="Proximo"
          >
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Scrollable gallery */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#020617] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#020617] to-transparent z-10 pointer-events-none" />

          <div
            ref={scrollRef}
            className="template-gallery-scroll flex gap-5 overflow-x-auto px-4 py-2"
          >
            {templates.map((t, i) => (
              <MiniCard key={i} t={t} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
