import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Eye, Star, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatItem {
  icon: LucideIcon;
  end: number;
  suffix: string;
  label: string;
  decimals?: number;
}

const stats: StatItem[] = [
  { icon: Users, end: 500, suffix: '+', label: 'Cartoes criados' },
  { icon: Eye, end: 10, suffix: 'k+', label: 'Visualizacoes' },
  { icon: Star, end: 4.9, suffix: '', label: 'Avaliacao media', decimals: 1 },
  { icon: Clock, end: 30, suffix: 's', label: 'Para criar seu cartao' },
];

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
