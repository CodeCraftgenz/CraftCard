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
            Como <span className="gradient-text">funciona</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Tres passos simples para ter seu cartao digital no ar
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="text-center group"
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
    </section>
  );
}
