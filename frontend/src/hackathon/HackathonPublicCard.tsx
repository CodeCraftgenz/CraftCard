import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { GraduationCap, Sparkles, Share2, Check, QrCode } from 'lucide-react';
import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { api } from '@/lib/api';
import { resolvePhotoUrl } from '@/lib/constants';
import {
  HACKATHON_CONFIG, HACKATHON_LOGO,
  parseHackathonMeta, getAreaById, getSkillById,
} from './constants';

// ── Types ──────────────────────────────────────────────────

interface HackathonProfile {
  id: string;
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
  buttonColor: string;
  socialLinks: Array<{
    platform: string;
    label: string;
    url: string;
    linkType?: string | null;
    metadata?: string | null;
  }>;
}

// ── Component ──────────────────────────────────────────────

export default function HackathonPublicCard() {
  const { slug } = useParams<{ slug: string }>();
  const [copied, setCopied] = useState(false);

  const { data: profile, isLoading, isError } = useQuery<HackathonProfile>({
    queryKey: ['hackathon-profile', slug],
    queryFn: () => api.get(`/profile/${slug}`),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, #001a33)` }}
      >
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, #001a33)` }}
      >
        <div className="text-center">
          <GraduationCap size={48} className="mx-auto mb-4 text-white/30" />
          <h1 className="text-xl font-bold text-white mb-2">Perfil nao encontrado</h1>
          <p className="text-white/50 text-sm">Esse cartao do hackathon nao existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  // Extract hackathon metadata from the hidden social link
  const metaLink = profile.socialLinks.find(l => l.linkType === 'hackathon_meta');
  const hackathonData = parseHackathonMeta(metaLink?.metadata);
  const area = hackathonData.hackathonArea ? getAreaById(hackathonData.hackathonArea) : null;
  const skills = (hackathonData.hackathonSkills || [])
    .map(id => getSkillById(id))
    .filter(Boolean);

  const accentColor = area?.color || HACKATHON_CONFIG.senacOrange;
  const photoSrc = profile.photoUrl ? resolvePhotoUrl(profile.photoUrl) : null;

  const handleShare = async () => {
    const url = `${window.location.origin}/hackathon/card/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${profile.displayName} - ${HACKATHON_CONFIG.name}`, url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Helmet>
        <title>{profile.displayName} | {HACKATHON_CONFIG.name}</title>
        <meta name="description" content={`Perfil de ${profile.displayName} no ${HACKATHON_CONFIG.name}`} />
      </Helmet>

      <div
        className="min-h-screen relative overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${HACKATHON_CONFIG.senacBlue} 0%, #001a33 40%, #0a0a1a 100%)` }}
      >
        {/* Senac logo background (inalteravel) */}
        <div
          className="absolute inset-0 bg-center bg-no-repeat bg-contain opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: `url(${HACKATHON_LOGO})` }}
        />

        {/* Decorative blobs */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[120px] opacity-20"
          style={{ background: accentColor }}
        />
        <div
          className="absolute bottom-0 left-0 w-60 h-60 rounded-full blur-[100px] opacity-15"
          style={{ background: HACKATHON_CONFIG.senacOrange }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-md mx-auto px-4 py-8">

          {/* Header badge */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <div
              className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-2"
              style={{ background: `${HACKATHON_CONFIG.senacOrange}25`, color: HACKATHON_CONFIG.senacOrange, border: `1px solid ${HACKATHON_CONFIG.senacOrange}40` }}
            >
              <GraduationCap size={14} />
              {HACKATHON_CONFIG.name}
            </div>
          </motion.div>

          {/* Profile Card */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden"
          >
            {/* Cover area with course image */}
            <div className="relative h-36 overflow-hidden">
              {area ? (
                <>
                  <img
                    src={area.coverImage}
                    alt={area.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${accentColor}20, ${HACKATHON_CONFIG.senacBlue}cc)` }} />
                  <div className="absolute top-3 right-3">
                    <img src={HACKATHON_LOGO} alt="Senac" className="w-12 h-12 object-contain opacity-80" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, ${HACKATHON_CONFIG.senacOrange})` }} />
              )}
            </div>

            {/* Avatar */}
            <div className="flex justify-center -mt-16 relative z-10">
              <div
                className="w-32 h-32 rounded-full border-4 overflow-hidden shadow-xl"
                style={{ borderColor: accentColor }}
              >
                {photoSrc ? (
                  <img src={photoSrc} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/10">
                    <GraduationCap size={40} className="text-white/30" />
                  </div>
                )}
              </div>
            </div>

            {/* Name + Bio */}
            <div className="text-center px-6 pt-4 pb-2">
              <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
              {area && (
                <p className="text-sm font-medium mt-1" style={{ color: accentColor }}>
                  {area.name}
                </p>
              )}
              {area && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/60 text-sm mt-2 italic"
                >
                  &ldquo;{area.fullPhrase}&rdquo;
                </motion.p>
              )}
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="px-6 py-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} style={{ color: accentColor }} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Soft Skills</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => skill && (
                    <div
                      key={skill.id}
                      className="px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 border"
                      style={{
                        borderColor: `${accentColor}30`,
                        background: `${accentColor}10`,
                      }}
                    >
                      <span>{skill.emoji}</span>
                      <span className="text-white/80 text-xs font-medium">{skill.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Area card with image */}
            {area && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mx-6 mb-4 rounded-2xl overflow-hidden border border-white/10"
              >
                <div className="relative h-32">
                  <img
                    src={area.coverImage}
                    alt={area.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="text-white font-bold text-sm">{area.name}</p>
                    <p className="text-white/60 text-xs">{area.phrase}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="px-6 pb-4 flex gap-3">
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
                style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, ${accentColor})` }}
              >
                {copied ? <><Check size={16} /> Copiado!</> : <><Share2 size={16} /> Compartilhar</>}
              </button>
            </div>

            {/* QR Code — always visible */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="px-6 pb-6 flex flex-col items-center gap-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <QrCode size={14} style={{ color: accentColor }} />
                <span className="text-xs font-semibold uppercase tracking-wider text-white/40">QR Code</span>
              </div>
              <div className="p-4 bg-white rounded-2xl">
                <QRCodeCanvas
                  value={`${window.location.origin}/hackathon/card/${slug}`}
                  size={180}
                  level="H"
                  fgColor={HACKATHON_CONFIG.senacBlue}
                />
              </div>
              <p className="text-white/30 text-xs text-center">
                Escaneie para ver este cartao
              </p>
            </motion.div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-white/15 text-xs mt-6"
          >
            Powered by CraftCard &times; {HACKATHON_CONFIG.name}
          </motion.p>
        </div>
      </div>
    </>
  );
}
