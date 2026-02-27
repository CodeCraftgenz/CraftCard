import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface RevealSectionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a section with blur-to-sharp + fade-up reveal on scroll.
 */
export function RevealSection({ children, className = '' }: RevealSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
