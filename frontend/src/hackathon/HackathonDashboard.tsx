import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap, Share2, Check, Copy, QrCode, ExternalLink,
  Pencil, LogOut, Sparkles,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { resolvePhotoUrl } from '@/lib/constants';
import {
  HACKATHON_CONFIG, HACKATHON_LOGO,
  parseHackathonMeta, getAreaById, getSkillById,
} from './constants';
import { HackathonTeamButton } from './HackathonTeamButton';

export default function HackathonDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data: profile, isLoading } = useProfile();
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
            <span className="text-sm font-medium text-green-400">Seu cartao esta no ar!</span>
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
          {/* Ver cartao publico */}
          <button
            type="button"
            onClick={() => window.open(`/hackathon/card/${profile.slug}`, '_blank')}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
            style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, ${accentColor})` }}
          >
            <ExternalLink size={16} /> Ver meu Cartao Publico
          </button>

          {/* Compartilhar */}
          <button
            type="button"
            onClick={handleShare}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
          >
            <Share2 size={16} style={{ color: accentColor }} /> Compartilhar
          </button>

          {/* Convidar para equipe */}
          <HackathonTeamButton slug={profile.slug} accent={accentColor} />

          {/* Editar perfil */}
          <button
            type="button"
            onClick={() => navigate('/hackathon?edit=1')}
            className="w-full py-3 rounded-xl font-medium text-sm text-white/50 flex items-center justify-center gap-2 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <Pencil size={14} /> Editar meu perfil
          </button>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-white/15 text-xs mt-8">
          Powered by CraftCard &times; {HACKATHON_CONFIG.name}
        </p>
      </div>

      {/* Full-screen QR modal for sharing */}
    </div>
  );
}
