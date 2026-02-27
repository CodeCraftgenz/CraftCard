import { motion } from 'framer-motion';

const decorations = [
  { icon: '+', x: '8%', y: '20%', size: 20, delay: 0, dur: 6, opacity: 0.15 },
  { icon: '+', x: '92%', y: '35%', size: 16, delay: 1.5, dur: 7, opacity: 0.12 },
  { icon: '+', x: '75%', y: '85%', size: 14, delay: 3, dur: 8, opacity: 0.10 },
  { icon: '→', x: '88%', y: '18%', size: 16, delay: 2, dur: 6.5, opacity: 0.12 },
  { icon: '↗', x: '82%', y: '55%', size: 14, delay: 4, dur: 7.5, opacity: 0.10 },
  { icon: '◇', x: '12%', y: '65%', size: 12, delay: 1, dur: 8, opacity: 0.08 },
  { icon: '○', x: '5%', y: '45%', size: 10, delay: 2.5, dur: 6, opacity: 0.10 },
  { icon: '·', x: '95%', y: '70%', size: 8, delay: 0.5, dur: 5, opacity: 0.15 },
  { icon: '△', x: '18%', y: '85%', size: 12, delay: 3.5, dur: 7, opacity: 0.08 },
  { icon: '↓', x: '55%', y: '90%', size: 14, delay: 5, dur: 6, opacity: 0.10 },
];

export function FloatingDecorations() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {decorations.map((d, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: d.opacity }}
          transition={{ delay: d.delay * 0.3, duration: 1 }}
          className="absolute text-white/[0.15] font-light select-none animate-float-decoration"
          style={{
            left: d.x,
            top: d.y,
            fontSize: d.size,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.dur}s`,
          }}
        >
          {d.icon}
        </motion.span>
      ))}
    </div>
  );
}
