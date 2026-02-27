import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MagneticButton } from '@/components/atoms/MagneticButton';
import { useAuth } from '@/providers/AuthProvider';

export function CtaSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/[0.05] via-violet-600/[0.04] to-blue-600/[0.05]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative"
      >
        <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
          Pronto para criar seu
          <br />
          <span className="gradient-text-animated">cartao digital</span>?
        </h2>
        <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
          Junte-se a profissionais e empresas que ja estao compartilhando seus contatos de
          forma moderna e elegante.
        </p>
        <div className="mt-10">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-4">
            <Sparkles size={12} />
            70% OFF - Oferta de lancamento
          </span>
          <br />
          <MagneticButton strength={0.25} className="inline-block">
            <Link
              to={isAuthenticated ? '/editor' : '/login'}
              className="btn-glossy btn-glow-hover group inline-flex items-center gap-2 px-10 py-4 rounded-xl gradient-bg text-white font-bold text-lg transition-all shadow-xl shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-2 focus:ring-offset-[#020617]"
            >
              Comecar agora
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </MagneticButton>
          <p className="mt-4 text-sm text-slate-600">
            Comece gratis &middot; Preco promocional de R$30/ano por tempo limitado
          </p>
        </div>
      </motion.div>
    </section>
  );
}
