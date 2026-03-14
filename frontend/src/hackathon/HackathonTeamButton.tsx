import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, X, Copy, Check, UserPlus } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { HACKATHON_CONFIG } from './constants';

interface HackathonTeamButtonProps {
  /** The slug of the profile to invite to the team */
  slug: string;
  /** Accent color to use (from area color) */
  accent?: string;
}

export function HackathonTeamButton({ slug, accent = HACKATHON_CONFIG.senacOrange }: HackathonTeamButtonProps) {
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  const teamUrl = `${window.location.origin}/hackathon/card/${slug}?team=1`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(teamUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setShowQr(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
      >
        <Users size={16} style={{ color: accent }} />
        Convidar para Equipe
      </motion.button>

      {/* QR Modal */}
      <AnimatePresence>
        {showQr && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowQr(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-[#0f0f23] border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <UserPlus size={18} style={{ color: accent }} />
                  <h3 className="text-lg font-bold text-white">Convite de Equipe</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQr(false)}
                  aria-label="Fechar"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-sm text-white/50 mb-5">
                Escaneie o QR code ou compartilhe o link para convidar alguem para sua equipe no {HACKATHON_CONFIG.name}.
              </p>

              {/* QR Code */}
              <div className="flex justify-center mb-5">
                <div className="p-4 bg-white rounded-2xl">
                  <QRCodeCanvas
                    value={teamUrl}
                    size={200}
                    level="H"
                    fgColor={HACKATHON_CONFIG.senacBlue}
                  />
                </div>
              </div>

              {/* Copy link */}
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white/40 truncate">
                  {teamUrl}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-2.5 rounded-xl font-medium text-sm text-white flex items-center gap-1.5 transition-all hover:brightness-110"
                  style={{ background: accent }}
                >
                  {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
                </button>
              </div>

              {/* Team size note */}
              <p className="text-center text-white/20 text-xs mt-4">
                Maximo de {HACKATHON_CONFIG.maxTeamSize} membros por equipe
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
