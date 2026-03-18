import { useState } from 'react';
import { MessageCircle, X, Instagram, Github } from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/5535999358856?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20com%20o%20CraftCard';
const INSTAGRAM_URL = 'https://www.instagram.com/codecraftgenz/';
const GITHUB_URL = 'https://github.com/CodeCraftgenz';

interface SupportChatProps {
  /** Show full support panel (PRO+ users). False = just WhatsApp button */
  premium?: boolean;
}

export function SupportChat({ premium = false }: SupportChatProps) {
  const [open, setOpen] = useState(false);

  if (!premium) {
    // Simple floating WhatsApp button for landing page / free users
    return (
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="Fale conosco no WhatsApp"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:bg-green-600 hover:scale-110 transition-all"
      >
        <MessageCircle size={26} className="text-white" />
      </a>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded panel */}
      {open && (
        <div className="absolute bottom-16 right-0 w-72 bg-brand-bg-card border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">Suporte CraftCard</p>
                <p className="text-white/80 text-xs">Online 24h</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Fechar"
                className="p-1 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X size={18} className="text-white" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            <p className="text-white/60 text-xs">
              Como assinante, você tem suporte prioritário 24h. Escolha o canal:
            </p>

            {/* WhatsApp */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <MessageCircle size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">WhatsApp</p>
                <p className="text-white/40 text-xs">Resposta imediata</p>
              </div>
            </a>

            {/* Instagram */}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/20 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0">
                <Instagram size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Instagram</p>
                <p className="text-white/40 text-xs">@codecraftgenz</p>
              </div>
            </a>

            {/* GitHub */}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Github size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">GitHub</p>
                <p className="text-white/40 text-xs">CodeCraftGenZ</p>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Suporte 24h"
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
          open
            ? 'bg-white/10 shadow-white/5 rotate-0'
            : 'bg-green-500 shadow-green-500/30 hover:bg-green-600 hover:scale-110'
        }`}
      >
        {open ? (
          <X size={24} className="text-white" />
        ) : (
          <>
            <MessageCircle size={26} className="text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-brand-bg-dark animate-pulse" />
          </>
        )}
      </button>
    </div>
  );
}
