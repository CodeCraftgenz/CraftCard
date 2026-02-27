import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CardPreview } from '@/components/organisms/CardPreview';
import { FloatingDecorations } from '@/components/atoms/FloatingDecorations';
import { MagneticButton } from '@/components/atoms/MagneticButton';
import { Typewriter } from '@/components/atoms/Typewriter';
import { useAuth } from '@/providers/AuthProvider';

const wordReveal = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const wordItem = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
});

export function HeroSection() {
  const { isAuthenticated } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    cardRef.current.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)';
  }, []);

  const headlineWords = ['Seu', 'cartao', 'digital', 'profissional'];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0">
        <img
          src="/hero-tech.jpg"
          alt=""
          role="presentation"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          loading="eager"
          decoding="async"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/80 via-[#020617]/70 to-[#020617]/95" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.08] via-indigo-600/[0.05] to-violet-700/[0.06]" />
      </div>

      {/* Floating decorative elements (inspired by reference) */}
      <FloatingDecorations />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-20 relative">
        {/* Left: Text content */}
        <div className="text-center lg:text-left">
          {/* Badge */}
          <motion.div {...reveal(0)} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-indigo/[0.08] border border-brand-indigo/[0.15] mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-indigo opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-indigo" />
            </span>
            <span className="text-xs font-medium text-brand-indigo tracking-wide">Plataforma #1 de Cartoes Digitais</span>
          </motion.div>

          {/* Headline — staggered word reveal */}
          <motion.h1
            variants={wordReveal}
            initial="hidden"
            animate="show"
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight"
          >
            {headlineWords.map((word, i) => (
              <motion.span
                key={i}
                variants={wordItem}
                className={`inline-block mr-[0.25em] ${i === 1 || i === 2 ? 'gradient-text-animated' : ''}`}
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subtitle — typewriter */}
          <motion.p
            {...reveal(0.6)}
            className="mt-6 text-lg text-slate-400 max-w-lg mx-auto lg:mx-0 leading-relaxed"
          >
            <Typewriter
              text="Crie um cartao digital completo com foto, bio, redes sociais e WhatsApp. Compartilhe com um unico link e cause uma otima primeira impressao."
              speed={25}
              delay={1200}
            />
          </motion.p>

          {/* CTAs */}
          <motion.div
            {...reveal(0.75)}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          >
            <MagneticButton strength={0.25}>
              <Link
                to={isAuthenticated ? '/editor' : '/login'}
                className="btn-glossy btn-glow-hover group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl gradient-bg text-white font-semibold transition-all shadow-lg shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-2 focus:ring-offset-[#020617]"
              >
                <Sparkles size={16} className="opacity-70" />
                Criar meu cartao
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </MagneticButton>
            <MagneticButton strength={0.2}>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border border-white/[0.08] text-slate-400 font-medium hover:bg-white/[0.04] hover:border-white/[0.14] hover:text-white transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                Ver como funciona
              </a>
            </MagneticButton>
          </motion.div>
        </div>

        {/* Right: 3D Tilt Card Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center relative perspective-1200"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Glow behind card */}
          <div className="absolute inset-0 rounded-full scale-75 animate-pulse-glow glow-card-bg" />
          <div
            ref={cardRef}
            className="relative transition-transform duration-200 ease-out preserve-3d"
          >
            {/* Subtle border glow ring */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-blue-500/25 via-indigo-500/15 to-violet-600/25 blur-sm" />
            <CardPreview demo />
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/[0.08] flex items-start justify-center p-1.5">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full bg-indigo-400/50"
          />
        </div>
      </motion.div>
    </section>
  );
}
