import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Instagram,
  Linkedin,
  Github,
  Globe,
  Mail,
  MessageCircle,
  ExternalLink,
  User,
  BadgeCheck,
  Phone,
  Music,
  PlayCircle,
  MapPin,
  FileDown,
  CreditCard,
  Minus,
} from 'lucide-react';

interface CardPreviewProps {
  displayName?: string;
  bio?: string;
  photoUrl?: string;
  coverPhotoUrl?: string;
  buttonColor?: string;
  cardTheme?: string;
  availabilityStatus?: string;
  photoPositionY?: number;
  coverPositionY?: number;
  isVerified?: boolean;
  fontFamily?: string | null;
  fontSizeScale?: number;
  backgroundType?: string;
  backgroundGradient?: string | null;
  backgroundPattern?: string | null;
  linkStyle?: string;
  linkAnimation?: string;
  socialLinks?: Array<{
    platform: string;
    label: string;
    url: string;
    linkType?: string | null;
  }>;
  demo?: boolean;
}

const DEMO_CARD: CardPreviewProps = {
  displayName: 'Maria Silva',
  bio: 'Designer & Criadora de Conteudo. Ajudo marcas a crescerem com design autenticado e estrategias criativas.',
  buttonColor: '#00E4F2',
  socialLinks: [
    { platform: 'instagram', label: 'Instagram', url: '#' },
    { platform: 'linkedin', label: 'LinkedIn', url: '#' },
    { platform: 'email', label: 'Email', url: '#' },
    { platform: 'whatsapp', label: 'WhatsApp', url: '#' },
  ],
};

const platformIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  website: Globe,
  email: Mail,
  whatsapp: MessageCircle,
  custom: ExternalLink,
  phone: Phone,
  music_embed: Music,
  video_embed: PlayCircle,
  map: MapPin,
  file: FileDown,
  pix: CreditCard,
  header: Minus,
};

function getThemeBackground(theme: string, accent: string): string {
  switch (theme) {
    case 'gradient':
      return `linear-gradient(135deg, ${accent}25 0%, #D12BF220 50%, #1A1A2E 100%)`;
    case 'minimal':
      return '#1A1A2E';
    case 'bold':
      return `linear-gradient(180deg, ${accent}30 0%, ${accent}10 30%, #1A1A2E 60%)`;
    case 'ocean':
      return 'linear-gradient(135deg, #0077B620 0%, #20B2AA20 50%, #1A1A2E 100%)';
    case 'sunset':
      return 'linear-gradient(135deg, #FF634720 0%, #FF69B420 50%, #1A1A2E 100%)';
    case 'forest':
      return 'linear-gradient(135deg, #22883320 0%, #50C87820 50%, #1A1A2E 100%)';
    case 'neon':
      return '#0A0A0A';
    case 'elegant':
      return 'linear-gradient(180deg, #B8860B15 0%, #8B451310 30%, #1A1A2E 60%)';
    case 'cosmic':
      return 'linear-gradient(135deg, #6A0DAD20 0%, #1E3A8A20 50%, #0F0F2E 100%)';
    default:
      return `linear-gradient(180deg, ${accent}15 0%, #1A1A2E 30%, #1A1A2E 100%)`;
  }
}

function getThemeCardClass(theme: string): string {
  switch (theme) {
    case 'neon':
      return 'border border-pink-500/40 shadow-[0_0_20px_rgba(236,72,153,0.1)]';
    case 'ocean':
      return 'border border-teal-500/20';
    case 'sunset':
      return 'border border-orange-500/20';
    case 'forest':
      return 'border border-green-500/20';
    case 'elegant':
      return 'border border-yellow-600/20';
    case 'cosmic':
      return 'border border-purple-500/20';
    case 'bold':
      return 'border-2 border-white/20';
    case 'minimal':
      return '';
    default:
      return 'border border-white/10';
  }
}

function getLinkClasses(style: string): string {
  switch (style) {
    case 'pill':
      return 'rounded-full';
    case 'square':
      return 'rounded-md';
    case 'outline':
      return 'rounded-xl bg-transparent !border';
    case 'ghost':
      return 'rounded-xl bg-transparent';
    default:
      return 'rounded-xl';
  }
}

function getHoverAnim(anim: string): Record<string, number> {
  switch (anim) {
    case 'scale': return { scale: 1.06 };
    case 'slide': return { x: 6 };
    case 'glow': return { scale: 1.03 };
    default: return { scale: 1.02 };
  }
}

export const CardPreview = memo(function CardPreview({
  displayName,
  bio,
  photoUrl,
  coverPhotoUrl,
  buttonColor,
  cardTheme,
  availabilityStatus,
  photoPositionY = 50,
  coverPositionY = 50,
  isVerified,
  fontFamily,
  fontSizeScale = 1,
  backgroundType,
  backgroundGradient,
  backgroundPattern,
  linkStyle = 'rounded',
  linkAnimation = 'none',
  socialLinks,
  demo,
}: CardPreviewProps) {
  const card = demo ? DEMO_CARD : {
    displayName, bio, photoUrl, coverPhotoUrl, buttonColor, cardTheme,
    availabilityStatus, photoPositionY, coverPositionY, isVerified, socialLinks,
  };
  const accent = card.buttonColor || '#00E4F2';
  const theme = card.cardTheme || 'default';
  const font = fontFamily || 'Inter';
  const scale = fontSizeScale || 1;
  const bgType = backgroundType || 'theme';

  // Compute background
  const computedBg = (() => {
    if (bgType === 'gradient' && backgroundGradient) {
      const parts = backgroundGradient.split(',');
      if (parts.length >= 3) return `linear-gradient(${parts[0]},${parts[1]},${parts[2]})`;
    }
    if (bgType === 'pattern') {
      return getThemeBackground(theme, accent);
    }
    return getThemeBackground(theme, accent);
  })();

  const linkClass = getLinkClasses(linkStyle);
  const themeCardClass = getThemeCardClass(theme);

  return (
    <motion.div
      initial={demo ? { opacity: 0, scale: 0.95 } : false}
      animate={demo ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.5 }}
      className="w-full max-w-[340px] mx-auto"
      style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${scale}rem` }}
    >
      <div
        className={`rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl bg-white/[0.06] ${themeCardClass}`}
        style={{ background: computedBg }}
      >
        {/* Pattern overlay */}
        {bgType === 'pattern' && backgroundPattern && (
          <div className="absolute inset-0 pointer-events-none opacity-10">
            {backgroundPattern === 'dots' && (
              <svg width="100%" height="100%">
                <pattern id="prev-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="3" cy="3" r="1.5" fill={`${accent}30`} />
                </pattern>
                <rect width="100%" height="100%" fill="url(#prev-dots)" />
              </svg>
            )}
          </div>
        )}

        {/* Cover Photo */}
        {card.coverPhotoUrl && (
          <div
            className="w-full h-20 bg-white/5"
            style={{
              backgroundImage: `url(${card.coverPhotoUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: `center ${card.coverPositionY ?? 50}%`,
            }}
          />
        )}

        <div className={`p-6 flex flex-col items-center text-center ${card.coverPhotoUrl ? '-mt-10' : ''}`}>
          {/* Avatar */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-lg border-4 border-[#16213E]"
            style={{
              background: card.photoUrl
                ? undefined
                : `linear-gradient(135deg, ${accent}, #D12BF2)`,
              ...(card.photoUrl ? {
                backgroundImage: `url(${card.photoUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: `center ${card.photoPositionY ?? 50}%`,
              } : {}),
            }}
          >
            {!card.photoUrl && <User className="w-10 h-10 text-white" />}
          </div>

          {/* Name */}
          <h3 className="font-bold text-white mb-1 flex items-center justify-center gap-1" style={{ fontSize: '1.25em' }}>
            {card.displayName || 'Seu Nome'}
            {card.isVerified && (
              <BadgeCheck size={18} className="text-blue-400 shrink-0" />
            )}
          </h3>

          {/* Availability Badge */}
          {card.availabilityStatus && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className={`w-2 h-2 rounded-full ${
                card.availabilityStatus === 'available' ? 'bg-green-400' :
                card.availabilityStatus === 'busy' ? 'bg-yellow-400' : 'bg-red-400'
              }`} />
              <span className="text-white/50" style={{ fontSize: '0.6875em' }}>
                {card.availabilityStatus === 'available' ? 'Disponivel' :
                 card.availabilityStatus === 'busy' ? 'Ocupado' : 'Indisponivel'}
              </span>
            </div>
          )}

          {/* Bio */}
          {card.bio && (
            <p className="text-white/60 mb-6 leading-relaxed max-w-[260px]" style={{ fontSize: '0.875em' }}>
              {card.bio}
            </p>
          )}

          {/* Social Links */}
          <div className="w-full flex flex-col gap-2.5">
            {(card.socialLinks || []).map((link, i) => {
              // Header separator
              if (link.platform === 'header' || link.linkType === 'header') {
                return (
                  <div key={i} className="font-semibold text-white/40 uppercase tracking-wider mt-2 mb-1 text-left px-1" style={{ fontSize: '0.75em' }}>
                    {link.label}
                  </div>
                );
              }

              const Icon = platformIcons[link.platform] || Globe;
              const isOutline = linkStyle === 'outline';
              const isGhost = linkStyle === 'ghost';

              return (
                <motion.div
                  key={i}
                  whileHover={getHoverAnim(linkAnimation)}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-4 py-3 text-white font-medium transition-all cursor-pointer ${linkClass} ${linkAnimation === 'glow' ? 'hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]' : ''}`}
                  style={{
                    fontSize: '0.875em',
                    backgroundColor: isGhost ? 'transparent' : isOutline ? 'transparent' : `${accent}20`,
                    borderColor: isOutline ? `${accent}60` : undefined,
                    borderWidth: isOutline ? 1 : undefined,
                    borderLeft: !isOutline && !isGhost ? `3px solid ${accent}` : undefined,
                  }}
                >
                  <Icon size={18} style={{ color: accent }} />
                  <span>{link.label || 'Link'}</span>
                  <span className="ml-auto text-white/30">&rsaquo;</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
