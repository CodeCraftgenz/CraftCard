import { motion } from 'framer-motion';
import { Smartphone, Zap, Share2, Palette, Shield, Globe } from 'lucide-react';

const benefits = [
  {
    icon: Smartphone,
    title: 'Mobile-first',
    desc: 'Perfeito em qualquer dispositivo, do celular ao desktop.',
  },
  {
    icon: Zap,
    title: 'Pronto em minutos',
    desc: 'Crie e publique seu cartao digital em menos de 5 minutos.',
  },
  {
    icon: Share2,
    title: 'Link unico',
    desc: 'Compartilhe um unico link com todos os seus contatos e redes.',
  },
  {
    icon: Palette,
    title: 'Totalmente customizavel',
    desc: 'Escolha cores, fotos e organize seus links do seu jeito.',
  },
  {
    icon: Shield,
    title: 'Seguro e confiavel',
    desc: 'Seus dados protegidos com criptografia e pagamento seguro.',
  },
  {
    icon: Globe,
    title: 'Alcance global',
    desc: 'Acessivel de qualquer lugar do mundo, 24 horas por dia.',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function BenefitsSection() {
  return (
    <section id="beneficios" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Por que escolher o <span className="gradient-text">CraftCard</span>?
          </h2>
          <p className="mt-4 text-white/50 max-w-2xl mx-auto">
            Tudo o que voce precisa para ter uma presenca digital profissional
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              variants={item}
              className="glass-card p-6 hover:border-brand-cyan/30 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-brand-cyan/20 transition-shadow">
                <b.icon size={22} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{b.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
