import { motion } from 'framer-motion';
import { Smartphone, Zap, Share2, Palette, Shield, Globe } from 'lucide-react';

const benefits = [
  {
    icon: Smartphone,
    title: 'Mobile-first',
    desc: 'Perfeito em qualquer dispositivo, do celular ao desktop.',
    span: 'col-span-1 md:col-span-2 lg:col-span-2',
  },
  {
    icon: Zap,
    title: 'Pronto em minutos',
    desc: 'Crie e publique seu cartao digital em menos de 5 minutos.',
    span: 'col-span-1 md:col-span-2 lg:col-span-1',
  },
  {
    icon: Share2,
    title: 'Link unico',
    desc: 'Compartilhe um unico link com todos os seus contatos e redes.',
    span: 'col-span-1 lg:col-span-1',
  },
  {
    icon: Palette,
    title: 'Totalmente customizavel',
    desc: 'Escolha cores, fotos e organize seus links do seu jeito.',
    span: 'col-span-1 lg:col-span-1',
  },
  {
    icon: Shield,
    title: 'Seguro e confiavel',
    desc: 'Seus dados protegidos com criptografia e pagamento seguro.',
    span: 'col-span-1 lg:col-span-1',
  },
  {
    icon: Globe,
    title: 'Alcance global',
    desc: 'Acessivel de qualquer lugar do mundo, 24 horas por dia.',
    span: 'col-span-1 md:col-span-2 lg:col-span-1',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export function BenefitsSection() {
  return (
    <section id="beneficios" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
            Por que escolher o <span className="gradient-text">CraftCard</span>?
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Tudo o que voce precisa para ter uma presenca digital profissional
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4"
        >
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              variants={item}
              className={`${b.span} glass-card-hover border-glow-hover p-6 group`}
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600/[0.10] to-violet-600/[0.10] border border-indigo-500/[0.15] flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-indigo-500/15 group-hover:border-indigo-500/25 transition-all duration-300">
                <b.icon size={20} className="text-indigo-400" />
              </div>
              <h3 className="font-heading text-base font-semibold mb-1.5 tracking-tight">{b.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
