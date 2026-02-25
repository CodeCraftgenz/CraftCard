import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

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
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function SocialProofSection() {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold">
            O que nossos <span className="gradient-text">usuarios</span> dizem
          </h2>
          <p className="mt-4 text-white/50 max-w-2xl mx-auto">
            Profissionais e empresas que ja transformaram sua presenca digital
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={item}
              className="glass-card p-6 relative"
            >
              <Quote size={24} className="text-brand-cyan/20 absolute top-4 right-4" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={14} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-white/70 leading-relaxed mb-4">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-cyan to-brand-magenta flex items-center justify-center text-white text-xs font-bold">
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-white/40">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
