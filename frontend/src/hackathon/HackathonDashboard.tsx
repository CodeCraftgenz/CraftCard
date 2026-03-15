import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap, Share2, Check, Copy, QrCode, ExternalLink,
  Pencil, LogOut, Sparkles, Crown, Zap, BarChart3, Palette, Link2,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile, useCards } from '@/hooks/useProfile';
import { resolvePhotoUrl } from '@/lib/constants';
import {
  HACKATHON_CONFIG, HACKATHON_LOGO,
  parseHackathonMeta, getAreaById, getSkillById,
} from './constants';
import { lazy, Suspense } from 'react';
const HackathonTeamTab = lazy(() => import('./HackathonTeamTab'));

export default function HackathonDashboard() {
  const navigate = useNavigate();
  const { logout, hasPaid, plan } = useAuth();
  const { data: cards, isLoading: cardsLoading } = useCards();
  // Find the hackathon-specific profile (separate from the primary/paid card)
  const hackCard = cards?.find((c: { label?: string }) => c.label === 'Hackathon Senac');
  const { data: profile, isLoading: profileLoading } = useProfile(hackCard?.id, !!hackCard);
  const isLoading = cardsLoading || profileLoading;
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (isLoading || !profile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, #001a33)` }}
      >
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Extract hackathon data
  const metaLink = profile.socialLinks?.find(l => l.linkType === 'hackathon_meta');
  const hackathonData = parseHackathonMeta(metaLink?.metadata);
  const area = hackathonData.hackathonArea ? getAreaById(hackathonData.hackathonArea) : null;
  const skills = (hackathonData.hackathonSkills || [])
    .map(id => getSkillById(id))
    .filter(Boolean);

  const accentColor = area?.color || HACKATHON_CONFIG.senacOrange;
  const photoSrc = profile.photoUrl ? resolvePhotoUrl(profile.photoUrl) : null;
  const cardUrl = `${window.location.origin}/hackathon/card/${profile.slug}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${profile.displayName} - ${HACKATHON_CONFIG.name}`, url: cardUrl });
      } catch { /* cancelled */ }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${HACKATHON_CONFIG.senacBlue} 0%, #001a33 40%, #0a0a1a 100%)` }}
    >
      {/* Background logo */}
      <div
        className="absolute inset-0 bg-center bg-no-repeat bg-contain opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `url(${HACKATHON_LOGO})` }}
      />

      <div className="relative z-10 max-w-md mx-auto px-4 py-6">

        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-2">
            <GraduationCap size={24} style={{ color: HACKATHON_CONFIG.senacOrange }} />
            <h1 className="text-lg font-bold text-white">{HACKATHON_CONFIG.name}</h1>
          </div>
          <button
            type="button"
            onClick={async () => { await logout(); navigate('/hackathon'); }}
            className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-green-400">Seu cartão está no ar!</span>
            {hasPaid && (
              <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {plan}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white/50 truncate">
              {cardUrl}
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition"
              title="Copiar link"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition"
              title="QR Code"
            >
              <QrCode size={16} />
            </button>
          </div>

          {/* QR Code inline */}
          {showQr && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-4 flex justify-center"
            >
              <div className="p-4 bg-white rounded-2xl">
                <QRCodeCanvas
                  value={cardUrl}
                  size={180}
                  level="H"
                  fgColor={HACKATHON_CONFIG.senacBlue}
                />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Mini Preview Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden mb-4"
        >
          {/* Cover */}
          <div className="relative h-28 overflow-hidden">
            {area ? (
              <>
                <img src={area.coverImage} alt={area.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${accentColor}20, ${HACKATHON_CONFIG.senacBlue}cc)` }} />
              </>
            ) : (
              <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, ${HACKATHON_CONFIG.senacOrange})` }} />
            )}
          </div>

          {/* Avatar + Info */}
          <div className="flex items-start gap-4 px-4 -mt-10 relative z-10 pb-4">
            <div
              className="w-20 h-20 rounded-full border-3 overflow-hidden shadow-lg flex-shrink-0"
              style={{ borderColor: accentColor }}
            >
              {photoSrc ? (
                <img src={photoSrc} alt={profile.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/10">
                  <GraduationCap size={28} className="text-white/30" />
                </div>
              )}
            </div>
            <div className="pt-12 min-w-0">
              <h2 className="text-lg font-bold text-white truncate">{profile.displayName}</h2>
              {area && (
                <p className="text-xs font-medium truncate" style={{ color: accentColor }}>{area.name}</p>
              )}
            </div>
          </div>

          {/* Skills badges */}
          {skills.length > 0 && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={12} style={{ color: accentColor }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Soft Skills</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skills.map(skill => skill && (
                  <span
                    key={skill.id}
                    className="px-2 py-1 rounded-lg text-xs flex items-center gap-1 border"
                    style={{ borderColor: `${accentColor}25`, background: `${accentColor}10` }}
                  >
                    <span className="text-[11px]">{skill.emoji}</span>
                    <span className="text-white/70 text-[11px]">{skill.label}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >
          {/* Ver cartão público */}
          <button
            type="button"
            onClick={() => window.open(`/hackathon/card/${profile.slug}`, '_blank')}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
            style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, ${accentColor})` }}
          >
            <ExternalLink size={16} /> Ver meu Cartão Publico
          </button>

          {/* Compartilhar */}
          <button
            type="button"
            onClick={handleShare}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
          >
            <Share2 size={16} style={{ color: accentColor }} /> Compartilhar
          </button>

          {/* PRO: Acessar Editor Completo */}
          {hasPaid && (
            <button
              type="button"
              onClick={() => navigate('/editor')}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #6C5CE7, #E84393)' }}
            >
              <Crown size={16} /> Acessar Editor Completo
            </button>
          )}

          {/* Editar perfil hackathon */}
          <button
            type="button"
            onClick={() => navigate('/hackathon?edit=1')}
            className="w-full py-3 rounded-xl font-medium text-sm text-white/50 flex items-center justify-center gap-2 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <Pencil size={14} /> Editar meu perfil
          </button>
        </motion.div>

        {/* ── Team Section ─────────────────────────────── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
        >
          <Suspense
            fallback={
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            }
          >
            <HackathonTeamTab accent={accentColor} />
          </Suspense>
        </motion.div>

        {/* ── Upsell Banner (FREE only) ─────────────────── */}
        {!hasPaid && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-6 relative overflow-hidden rounded-2xl border border-purple-500/20"
            style={{ background: 'linear-gradient(135deg, #6C5CE715, #E8439310, #0a0a1a)' }}
          >
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-30 bg-purple-500 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-[50px] opacity-20 bg-pink-500 pointer-events-none" />

            <div className="relative p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Va alem do Hackathon!</h3>
                  <p className="text-[11px] text-white/40">Plano CraftCard Pro</p>
                </div>
              </div>

              <p className="text-xs text-white/60 mb-4 leading-relaxed">
                Desbloqueie o editor completo com temas exclusivos, analytics, links ilimitados
                e muito mais. Seu cartão do hackathon continua funcionando normalmente!
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { icon: Palette, label: 'Temas exclusivos' },
                  { icon: BarChart3, label: 'Analytics' },
                  { icon: Link2, label: '20 links' },
                  { icon: Crown, label: "Sem marca d'agua" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-white/50">
                    <Icon size={12} className="text-purple-400" />
                    <span className="text-[11px]">{label}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigate('/billing')}
                className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 hover:scale-[1.01]"
                style={{ background: 'linear-gradient(135deg, #6C5CE7, #E84393)' }}
              >
                <Crown size={16} /> Quero o CraftCard Pro — R$30/ano
              </button>

              <p className="text-center text-white/20 text-[10px] mt-2">
                Pagamento único anual. Cancele quando quiser.
              </p>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <p className="text-center text-white/15 text-xs mt-8">
          Powered by CraftCard &times; {HACKATHON_CONFIG.name}
        </p>
      </div>
    </div>
  );
}
