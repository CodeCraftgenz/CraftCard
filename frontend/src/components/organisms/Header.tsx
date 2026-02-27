import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, LogOut, User, BookOpen, CreditCard, Shield, Webhook } from 'lucide-react';
import { Logo } from '@/components/atoms/Logo';
import { NotificationBell } from '@/components/organisms/NotificationBell';
import { useAuth } from '@/providers/AuthProvider';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isLanding = location.pathname === '/';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setShowDropdown(false);
    navigate('/');
    await logout();
  };

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
          {isLanding && (
            <>
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
            </>
          )}

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-7 h-7 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-brand-cyan/20 flex items-center justify-center">
                    <User size={14} className="text-brand-cyan" />
                  </div>
                )}
                <span className="text-sm text-white/80 max-w-[120px] truncate">{user.name}</span>
              </button>

              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-48 rounded-xl bg-brand-bg-card border border-white/10 shadow-xl overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-white/40 truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/editor"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 transition-colors"
                  >
                    <User size={14} />
                    Meu Cartao
                  </Link>
                  <Link
                    to="/tutorial"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 transition-colors"
                  >
                    <BookOpen size={14} />
                    Tutorial
                  </Link>
                  <Link
                    to="/billing"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 transition-colors"
                  >
                    <CreditCard size={14} />
                    Meu Plano
                  </Link>
                  <Link
                    to="/webhooks"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 transition-colors"
                  >
                    <Webhook size={14} />
                    Integracoes
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-cyan hover:bg-white/5 transition-colors"
                    >
                      <Shield size={14} />
                      Painel Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
                  >
                    <LogOut size={14} />
                    Sair
                  </button>
                </motion.div>
              )}
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-5 py-2 rounded-xl gradient-bg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Comecar Agora
            </Link>
          )}
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
            {isLanding && (
              <>
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
              </>
            )}

            {isAuthenticated && user ? (
              <>
                <div className="flex items-center justify-between py-2 border-t border-white/5">
                  <div className="flex items-center gap-3">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-cyan/20 flex items-center justify-center">
                      <User size={14} className="text-brand-cyan" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-white/40 truncate">{user.email}</p>
                  </div>
                  </div>
                  <NotificationBell />
                </div>
                <Link
                  to="/editor"
                  className="text-sm text-white/70 py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Meu Cartao
                </Link>
                <Link
                  to="/tutorial"
                  className="text-sm text-white/70 py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Tutorial
                </Link>
                <Link
                  to="/billing"
                  className="text-sm text-white/70 py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Meu Plano
                </Link>
                <Link
                  to="/webhooks"
                  className="text-sm text-white/70 py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Integracoes
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-sm text-brand-cyan py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    Painel Admin
                  </Link>
                )}
                <button
                  onClick={() => { setIsOpen(false); handleLogout(); }}
                  className="text-sm text-red-400 py-2 text-left"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl gradient-bg text-sm font-semibold text-white text-center"
                onClick={() => setIsOpen(false)}
              >
                Comecar Agora
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
