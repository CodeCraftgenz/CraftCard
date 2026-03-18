import { Logo } from '@/components/atoms/Logo';
import { MessageCircle, Instagram, Github, Mail, Phone } from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/5535999358856?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20com%20o%20CraftCard';
const INSTAGRAM_URL = 'https://www.instagram.com/codecraftgenz/';
const GITHUB_URL = 'https://github.com/CodeCraftgenz';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-brand-bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Top: Logo + Social icons */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
          {/* Brand */}
          <div className="max-w-xs">
            <Logo />
            <p className="text-sm text-white/50 mt-3 leading-relaxed">
              Crie cartões digitais profissionais em minutos. Compartilhe com um QR Code e impressione em qualquer lugar.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 mt-5">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 hover:bg-green-500/20 transition-colors"
              >
                <MessageCircle size={18} />
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 hover:bg-pink-500/20 transition-colors"
              >
                <Instagram size={18} />
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub"
                className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 transition-colors"
              >
                <Github size={18} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-14">
            {/* Produto */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Produto</h4>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li><a href="/#beneficios" className="hover:text-white transition-colors">Benefícios</a></li>
                <li><a href="/#como-funciona" className="hover:text-white transition-colors">Como Funciona</a></li>
                <li><a href="/#preco" className="hover:text-white transition-colors">Planos e Preços</a></li>
                <li><a href="/#faq" className="hover:text-white transition-colors">Perguntas Frequentes</a></li>
              </ul>
            </div>

            {/* Recursos */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Recursos</h4>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li><a href="/register" className="hover:text-white transition-colors">Criar Conta Grátis</a></li>
                <li><a href="/login" className="hover:text-white transition-colors">Entrar</a></li>
                <li><a href="/tutorial" className="hover:text-white transition-colors">Tutorial</a></li>
                <li><a href="/billing" className="hover:text-white transition-colors">Upgrade</a></li>
              </ul>
            </div>

            {/* Suporte */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Suporte</h4>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                    <MessageCircle size={14} className="text-green-400" /> WhatsApp 24h
                  </a>
                </li>
                <li>
                  <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                    <Instagram size={14} className="text-pink-400" /> @codecraftgenz
                  </a>
                </li>
                <li>
                  <a href="mailto:codecraftgenz@gmail.com" className="hover:text-white transition-colors flex items-center gap-2">
                    <Mail size={14} className="text-brand-cyan" /> codecraftgenz@gmail.com
                  </a>
                </li>
                <li>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                    <Phone size={14} className="text-white/40" /> (35) 99935-8856
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} CraftCard. Produto <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white/60 transition-colors">CodeCraftGenZ</a>.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <a href="/privacy" className="hover:text-white/60 transition-colors">Política de Privacidade</a>
            <span className="text-white/10">|</span>
            <a href="/privacy" className="hover:text-white/60 transition-colors">Termos de Uso</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
