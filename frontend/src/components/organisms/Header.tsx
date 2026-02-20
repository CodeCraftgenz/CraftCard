import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/atoms/Logo';
import { useAuth } from '@/providers/AuthProvider';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#beneficios" className="text-sm text-white/70 hover:text-white transition-colors">
            Beneficios
          </a>
          <a href="#como-funciona" className="text-sm text-white/70 hover:text-white transition-colors">
            Como Funciona
          </a>
          <a href="#preco" className="text-sm text-white/70 hover:text-white transition-colors">
            Preco
          </a>
          <a href="#faq" className="text-sm text-white/70 hover:text-white transition-colors">
            FAQ
          </a>
          <Link
            to={isAuthenticated ? '/editor' : '/login'}
            className="px-5 py-2 rounded-xl gradient-bg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            {isAuthenticated ? 'Meu Cartao' : 'Comecar Agora'}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden glass border-t border-white/5"
        >
          <div className="px-4 py-4 flex flex-col gap-3">
            <a href="#beneficios" className="text-sm text-white/70 py-2" onClick={() => setIsOpen(false)}>
              Beneficios
            </a>
            <a href="#como-funciona" className="text-sm text-white/70 py-2" onClick={() => setIsOpen(false)}>
              Como Funciona
            </a>
            <a href="#preco" className="text-sm text-white/70 py-2" onClick={() => setIsOpen(false)}>
              Preco
            </a>
            <a href="#faq" className="text-sm text-white/70 py-2" onClick={() => setIsOpen(false)}>
              FAQ
            </a>
            <Link
              to={isAuthenticated ? '/editor' : '/login'}
              className="px-5 py-2.5 rounded-xl gradient-bg text-sm font-semibold text-white text-center"
              onClick={() => setIsOpen(false)}
            >
              {isAuthenticated ? 'Meu Cartao' : 'Comecar Agora'}
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
