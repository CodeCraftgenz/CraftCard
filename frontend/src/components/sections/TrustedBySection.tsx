import { motion } from 'framer-motion';
import { Users, Eye, Star, Clock } from 'lucide-react';

const stats = [
  { icon: Users, value: '500+', label: 'Cartoes criados' },
  { icon: Eye, value: '10k+', label: 'Visualizacoes' },
  { icon: Star, value: '4.9', label: 'Avaliacao media' },
  { icon: Clock, value: '30s', label: 'Para criar seu cartao' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function TrustedBySection() {
  return (
    <section className="py-16 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {stats.map((s, i) => (
            <motion.div
              key={i}
              variants={item}
              className="text-center p-4"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                <s.icon size={18} className="text-brand-cyan" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold gradient-text">{s.value}</p>
              <p className="text-xs text-white/40 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
