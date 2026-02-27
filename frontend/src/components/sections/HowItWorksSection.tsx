import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, CreditCard, Rocket } from 'lucide-react';

const steps = [
  {
    icon: LogIn,
    step: '01',
    title: 'Faca login',
    desc: 'Entre com sua conta Google em segundos. Sem criar senha.',
  },
  {
    icon: CreditCard,
    step: '02',
    title: 'Escolha seu plano',
    desc: 'Comece gratis ou escolha o plano ideal para voce. Profissionais e empresas.',
  },
  {
    icon: Rocket,
    step: '03',
    title: 'Publique',
    desc: 'Personalize seu cartao e compartilhe seu link exclusivo.',
  },
];

function ConnectingLine() {
  const ref = useRef<SVGSVGElement>(null);
  const [drawPct, setDrawPct] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const viewH = window.innerHeight;
      const start = viewH * 0.8;
      const end = viewH * 0.3;
      if (rect.top > start) {
        setDrawPct(0);
      } else if (rect.bottom < end) {
        setDrawPct(1);
      } else {
        const total = start - end;
        const current = start - rect.top;
        setDrawPct(Math.min(Math.max(current / total, 0), 1));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalLength = 600;
  const dashOffset = totalLength - drawPct * totalLength;

  return (
    <svg
      ref={ref}
      className="absolute top-10 left-0 w-full h-1 hidden md:block pointer-events-none"
      viewBox="0 0 800 2"
      preserveAspectRatio="none"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      {/* Background track */}
      <line
        x1="133"
        y1="1"
        x2="667"
        y2="1"
        stroke="rgba(99, 102, 241, 0.08)"
        strokeWidth="2"
        strokeDasharray="6 6"
      />
      {/* Animated draw line */}
      <line
        x1="133"
        y1="1"
        x2="667"
        y2="1"
        stroke="url(#lineGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={totalLength}
        strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 0.05s linear' }}
      />
      {/* Glow dot at the tip */}
      {drawPct > 0.02 && (
        <circle
          cx={133 + drawPct * 534}
          cy="1"
          r="4"
          fill="#818CF8"
          opacity="0.9"
          style={{ transition: 'cx 0.05s linear' }}
        />
      )}
    </svg>
  );
}

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-indigo/[0.015] to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
            Como <span className="gradient-text-animated">funciona</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Tres passos simples para ter seu cartao digital no ar
          </p>
        </motion.div>

        <div className="relative">
          <ConnectingLine />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="text-center group relative"
              >
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl glass mb-6 group-hover:bg-white/[0.06] group-hover:shadow-lg group-hover:shadow-indigo-500/10 transition-all duration-300">
                  <s.icon size={28} className="text-indigo-400" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-violet-600/30">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2 tracking-tight">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
