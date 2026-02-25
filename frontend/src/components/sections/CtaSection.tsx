import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

export function CtaSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan/5 via-brand-magenta/5 to-brand-purple/5" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative"
      >
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
          Pronto para criar seu
          <br />
          <span className="gradient-text">cartao digital</span>?
        </h2>
        <p className="mt-6 text-lg text-white/50 max-w-2xl mx-auto">
          Junte-se a profissionais e empresas que ja estao compartilhando seus contatos de
          forma moderna e elegante.
        </p>
        <div className="mt-10">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-cyan/10 text-brand-cyan text-xs font-semibold mb-4">
            <Sparkles size={12} />
            70% OFF - Oferta de lancamento
          </span>
          <br />
          <Link
            to={isAuthenticated ? '/editor' : '/login'}
            className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl gradient-bg text-white font-bold text-lg hover:opacity-90 transition-all shadow-xl shadow-brand-cyan/20"
          >
            Comecar agora
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-4 text-sm text-white/30">
            Comece gratis &middot; Preco promocional de R$30/ano por tempo limitado
          </p>
        </div>
      </motion.div>
    </section>
  );
}
