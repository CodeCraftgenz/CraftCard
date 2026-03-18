/**
 * SupportChat.tsx — Widget flutuante de suporte ao usuario.
 *
 * Possui dois modos de operacao:
 * 1. **Padrao (premium=false)**: Exibe apenas botao do WhatsApp com balao de saudacao.
 *    Usado para visitantes nao autenticados na landing page.
 * 2. **Premium (premium=true)**: Painel completo com multiplos canais (WhatsApp, Instagram, GitHub).
 *    Disponivel apenas para assinantes pagos (PRO+).
 *
 * O balao de saudacao aparece apos 3s na primeira visita e pode ser dispensado.
 * A preferencia de dispensa e salva no sessionStorage (reseta ao fechar aba).
 */

import { useState, useEffect } from 'react';
import { MessageCircle, X, Instagram, Github } from 'lucide-react';

// URLs dos canais de suporte da equipe CodeCraftGenZ
const WHATSAPP_URL = 'https://wa.me/5535999358856?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20com%20o%20CraftCard';
const INSTAGRAM_URL = 'https://www.instagram.com/codecraftgenz/';
const GITHUB_URL = 'https://github.com/CodeCraftgenz';

interface SupportChatProps {
  /** Quando true, exibe painel completo com multiplos canais (usuarios PRO+) */
  premium?: boolean;
}

export function SupportChat({ premium = false }: SupportChatProps) {
  const [open, setOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingDismissed, setGreetingDismissed] = useState(false);

  // Exibe balao de saudacao apos 3s na primeira visita da sessao.
  // Se o usuario ja dispensou o balao nesta sessao, nao exibe novamente.
  useEffect(() => {
    const dismissed = sessionStorage.getItem('support-greeting-dismissed');
    if (dismissed) { setGreetingDismissed(true); return; }
    const timer = setTimeout(() => setShowGreeting(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const dismissGreeting = () => {
    setShowGreeting(false);
    setGreetingDismissed(true);
    sessionStorage.setItem('support-greeting-dismissed', '1');
  };

  // --- Modo basico: apenas botao WhatsApp + balao de saudacao ---
  // Para visitantes nao autenticados e na landing page
  if (!premium) {
    return (
      <div className="fixed bottom-24 right-6 z-50">
        {/* Greeting bubble */}
        {showGreeting && !greetingDismissed && (
          <div className="absolute bottom-16 right-0 flex items-end gap-2 animate-in slide-in-from-bottom-3 fade-in duration-300">
            <div className="bg-white rounded-2xl rounded-br-md shadow-xl p-3 max-w-[220px] relative">
              <button
                type="button"
                title="Fechar"
                onClick={dismissGreeting}
                className="absolute -top-2 -right-2 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
              >
                <X size={10} className="text-gray-600" />
              </button>
              <p className="text-gray-800 text-sm leading-snug">
                Tem alguma pergunta? Ficarei feliz em ajudar!
              </p>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-500 shrink-0 bg-brand-bg-dark">
              <div className="w-full h-full bg-gradient-to-br from-brand-cyan to-brand-magenta flex items-center justify-center text-white font-bold text-xs">
                CC
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp button */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Fale conosco no WhatsApp"
          className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:bg-green-600 hover:scale-110 transition-all relative"
        >
          <MessageCircle size={26} className="text-white" />
          {!greetingDismissed && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-brand-bg-dark animate-pulse" />
          )}
        </a>
      </div>
    );
  }

  // --- Modo premium: painel expansivel com todos os canais de suporte ---
  // Inclui saudacao estilo chat, canais (WhatsApp, Instagram, GitHub) e indicador de online
  return (
    <div className="fixed bottom-24 right-6 z-50">
      {/* Greeting bubble (when panel closed) */}
      {!open && showGreeting && !greetingDismissed && (
        <div className="absolute bottom-16 right-0 flex items-end gap-2 animate-in slide-in-from-bottom-3 fade-in duration-300">
          <div className="bg-white rounded-2xl rounded-br-md shadow-xl p-3 max-w-[240px] relative">
            <button
              type="button"
              title="Fechar"
              onClick={dismissGreeting}
              className="absolute -top-2 -right-2 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
            >
              <X size={10} className="text-gray-600" />
            </button>
            <p className="text-gray-800 text-sm leading-snug">
              Olá! Precisa de ajuda? Nosso suporte 24h está disponível para você.
            </p>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-500 shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-brand-cyan to-brand-magenta flex items-center justify-center text-white font-bold text-xs">
              CC
            </div>
          </div>
        </div>
      )}

      {/* Expanded panel */}
      {open && (
        <div className="absolute bottom-16 right-0 w-80 bg-brand-bg-card border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/30 shrink-0">
                <div className="w-full h-full bg-gradient-to-br from-emerald-300 to-green-700 flex items-center justify-center text-white font-bold text-sm">
                  CC
                </div>
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Suporte CraftCard</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                  <p className="text-white/80 text-xs">Online 24h</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Fechar"
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X size={18} className="text-white" />
              </button>
            </div>
          </div>

          {/* Chat-like greeting */}
          <div className="p-4 bg-[#0d1117]">
            <div className="flex items-start gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shrink-0 text-white text-[10px] font-bold">
                CC
              </div>
              <div className="bg-white/10 rounded-2xl rounded-tl-md px-3.5 py-2.5 max-w-[85%]">
                <p className="text-white/90 text-sm leading-relaxed">
                  Olá! Como assinante, você tem suporte prioritário. Como posso ajudar?
                </p>
                <p className="text-white/30 text-[10px] mt-1">Agora</p>
              </div>
            </div>
          </div>

          {/* Channel buttons */}
          <div className="p-3 space-y-2 border-t border-white/5">
            <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium px-1">Escolha o canal</p>

            {/* WhatsApp */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <MessageCircle size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">WhatsApp</p>
                <p className="text-white/40 text-[11px]">Resposta imediata</p>
              </div>
              <span className="text-green-400 text-[10px] font-medium bg-green-500/10 px-2 py-0.5 rounded-full">24h</span>
            </a>

            {/* Instagram */}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/20 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0">
                <Instagram size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Instagram</p>
                <p className="text-white/40 text-[11px]">@codecraftgenz</p>
              </div>
            </a>

            {/* GitHub */}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Github size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">GitHub</p>
                <p className="text-white/40 text-[11px]">CodeCraftGenZ</p>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => { setOpen(!open); if (!open) dismissGreeting(); }}
        title="Suporte 24h"
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
          open
            ? 'bg-white/10 shadow-white/5'
            : 'bg-green-500 shadow-green-500/30 hover:bg-green-600 hover:scale-110'
        }`}
      >
        {open ? (
          <X size={24} className="text-white" />
        ) : (
          <>
            <MessageCircle size={26} className="text-white" />
            {!greetingDismissed && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-brand-bg-dark animate-pulse" />
            )}
          </>
        )}
      </button>
    </div>
  );
}
