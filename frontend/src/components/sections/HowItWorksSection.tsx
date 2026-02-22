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
    title: 'Assine por R$30/ano',
    desc: 'Menos de R$2,50/mes para ter seu cartao digital profissional.',
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
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-cyan/[0.02] to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Como <span className="gradient-text">funciona</span>
          </h2>
          <p className="mt-4 text-white/50 max-w-2xl mx-auto">
            Tres passos simples para ter seu cartao digital no ar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl glass mb-6">
                <s.icon size={28} className="text-brand-cyan" />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-xs font-bold">
                  {s.step}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
