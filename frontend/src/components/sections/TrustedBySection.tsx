/**
 * TrustedBySection — Secao de prova social com contadores animados.
 *
 * Busca dados reais da API (/api/stats/public) para exibir numeros autenticos
 * de cartoes criados, visualizacoes e usuarios. Se a API falhar (ex: backend
 * frio no Render), usa valores de fallback para nao deixar a secao vazia.
 */
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Eye, Clock, CreditCard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api } from '@/lib/api';

interface StatItem {
  icon: LucideIcon;
  end: number;
  suffix: string;
  label: string;
  decimals?: number;
}

/** Valores de fallback caso a API nao responda (ex: cold start do Render) */
const FALLBACK_STATS: StatItem[] = [
  { icon: CreditCard, end: 500, suffix: '+', label: 'Cartões criados' },
  { icon: Eye, end: 10, suffix: 'k+', label: 'Visualizações' },
  { icon: Users, end: 100, suffix: '+', label: 'Usuários ativos' },
  { icon: Clock, end: 30, suffix: 's', label: 'Para criar seu cartão' },
];

/** Formata numero grande: 1500 → {end: 1.5, suffix: 'k+'} */
function formatLargeNumber(n: number): { end: number; suffix: string; decimals?: number } {
  if (n >= 1000) return { end: parseFloat((n / 1000).toFixed(1)), suffix: 'k+', decimals: 1 };
  return { end: n, suffix: '+' };
}

function AnimatedCounter({ end, suffix, decimals = 0, started }: { end: number; suffix: string; decimals?: number; started: boolean }) {
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
      {display}{suffix}
    </span>
  );
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export function TrustedBySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);

  // Busca stats reais da API (cache de 5min, nao bloqueia renderizacao)
  const { data: apiStats } = useQuery<{ totalCards: number; totalViews: number; totalUsers: number }>({
    queryKey: ['public-stats'],
    queryFn: () => api.get('/stats/public'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Monta os stats dinamicamente: se API respondeu, usa dados reais; senao, fallback
  const stats: StatItem[] = apiStats
    ? [
        { icon: CreditCard, ...formatLargeNumber(apiStats.totalCards), label: 'Cartões criados' },
        { icon: Eye, ...formatLargeNumber(apiStats.totalViews), label: 'Visualizações' },
        { icon: Users, ...formatLargeNumber(apiStats.totalUsers), label: 'Usuários ativos' },
        { icon: Clock, end: 30, suffix: 's', label: 'Para criar seu cartão' },
      ]
    : FALLBACK_STATS;

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {stats.map((s, i) => (
            <motion.div
              key={i}
              variants={item}
              className="text-center p-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/[0.08] to-violet-600/[0.08] flex items-center justify-center mx-auto mb-3 group-hover:from-blue-600/[0.14] group-hover:to-violet-600/[0.14] transition-colors duration-300">
                <s.icon size={18} className="text-indigo-400" />
              </div>
              <p className="font-heading text-2xl sm:text-3xl font-extrabold gradient-text tracking-tight">
                <AnimatedCounter end={s.end} suffix={s.suffix} decimals={s.decimals} started={started} />
              </p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
