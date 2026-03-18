import { Logo } from '@/components/atoms/Logo';
import { MessageCircle, Instagram, Github } from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/5535999358856?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20com%20o%20CraftCard';
const INSTAGRAM_URL = 'https://www.instagram.com/codecraftgenz/';
const GITHUB_URL = 'https://github.com/CodeCraftgenz';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-brand-bg-dark/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo />
            <p className="text-sm text-white/50">
              Seu cartão digital profissional
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3 mt-2">
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
          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex items-center gap-6 text-sm text-white/50">
              <a href="/termos" className="hover:text-white transition-colors">
                Termos de Uso
              </a>
              <a href="/privacidade" className="hover:text-white transition-colors">
                Privacidade
              </a>
            </div>
            <p className="text-xs text-white/30">
              Suporte 24h via WhatsApp para assinantes
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-white/30 space-y-1">
          <p>{new Date().getFullYear()} CraftCard. Produto CodeCraftGenZ.</p>
          <a href="/privacy" className="text-white/20 hover:text-white/40 transition">Política de Privacidade</a>
        </div>
      </div>
    </footer>
  );
}
