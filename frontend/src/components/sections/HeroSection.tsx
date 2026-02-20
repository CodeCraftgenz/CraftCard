import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CardPreview } from '@/components/organisms/CardPreview';
import { useAuth } from '@/providers/AuthProvider';

export function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-cyan/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-brand-magenta/10 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">
        {/* Left: Text */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
            Seu{' '}
            <span className="gradient-text">cartao digital</span>
            <br />
            profissional
          </h1>
          <p className="mt-6 text-lg text-white/60 max-w-lg mx-auto lg:mx-0 leading-relaxed">
            Crie um cartao digital completo com foto, bio, redes sociais e
            WhatsApp. Compartilhe com um unico link e cause uma otima
            primeira impressao.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              to={isAuthenticated ? '/editor' : '/login'}
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl gradient-bg text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-brand-cyan/20"
            >
              Criar meu cartao
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border border-white/10 text-white/80 font-medium hover:bg-white/5 transition-all"
            >
              Ver Exemplo
            </a>
          </div>
        </motion.div>

        {/* Right: Card Preview */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center"
        >
          <CardPreview demo />
        </motion.div>
      </div>
    </section>
  );
}
