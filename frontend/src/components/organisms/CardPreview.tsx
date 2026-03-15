import { memo } from 'react';
import { motion } from 'framer-motion';
import { getGridSize, parseMetadata } from '@/lib/constants';
import { AnimatedBackgroundOverlay } from './AnimatedBackgroundOverlay';
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
  backgroundImageUrl?: string | null;
  backgroundOverlay?: number;
  backgroundPattern?: string | null;
  linkLayout?: string;
  linkStyle?: string;
  linkAnimation?: string;
  iconStyle?: string;
  socialLinks?: Array<{
    platform: string;
    label: string;
    url: string;
    linkType?: string | null;
    metadata?: string | null;
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

const platformColors: Record<string, string> = {
  instagram: '#E4405F',
  linkedin: '#0A66C2',
  github: '#FFFFFF',
  twitter: '#1DA1F2',
  youtube: '#FF0000',
  tiktok: '#000000',
  whatsapp: '#25D366',
  email: '#EA4335',
  phone: '#4CAF50',
  pix: '#32BCAD',
  map: '#4285F4',
  file: '#FF9800',
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
      return 'rounded-full bg-white/5 border border-white/10 hover:bg-white/10';
    case 'square':
      return 'rounded-none bg-white/5 border border-white/10 hover:bg-white/10';
    case 'outline':
      return 'rounded-xl bg-transparent border border-white/20 hover:bg-white/5';
    case 'ghost':
      return 'rounded-xl bg-transparent hover:bg-white/5';
    case 'elevated':
      return 'rounded-xl bg-white/[0.08] border border-white/5 shadow-lg shadow-black/30 hover:shadow-xl hover:bg-white/10';
    case 'glassmorphism':
      return 'rounded-xl bg-white/[0.07] backdrop-blur-md border border-white/15 hover:bg-white/[0.12]';
    case 'neon-border':
      return 'rounded-xl bg-white/[0.03] border border-white/20 hover:bg-white/[0.06]';
    default:
      return 'rounded-xl bg-white/5 border border-white/10 hover:bg-white/10';
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
  backgroundImageUrl,
  backgroundOverlay = 0.7,
  backgroundPattern,
  linkLayout = 'list',
  linkStyle = 'rounded',
  linkAnimation = 'none',
  iconStyle = 'default',
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
    if (bgType === 'image' && backgroundImageUrl) {
      return getThemeBackground(theme, accent);
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
        className={`relative rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl bg-white/[0.06] ${themeCardClass}`}
        style={{ background: computedBg }}
      >
        {/* Background image + overlay */}
        {bgType === 'image' && backgroundImageUrl && (
          <>
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${backgroundImageUrl})` }} />
            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${backgroundOverlay})` }} />
          </>
        )}

        {/* Pattern overlay */}
        {bgType === 'pattern' && backgroundPattern && (
          <div className="absolute inset-0 pointer-events-none opacity-10">
            <PreviewPatternSvg pattern={backgroundPattern} accent={accent} />
          </div>
        )}

        {/* Animated background overlay */}
        {bgType === 'animated' && backgroundPattern && (
          <AnimatedBackgroundOverlay pattern={backgroundPattern} accent={accent} />
        )}

        {/* Cover Photo */}
        {card.coverPhotoUrl && (
          <div
            className="relative z-[1] w-full h-20 bg-white/5"
            style={{
              backgroundImage: `url(${card.coverPhotoUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: `center ${card.coverPositionY ?? 50}%`,
            }}
          />
        )}

        <div className={`relative z-[1] p-6 flex flex-col items-center text-center ${card.coverPhotoUrl ? '-mt-10' : ''}`}>
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
          <h3 className="font-bold text-white mb-1 flex items-center justify-center gap-1 max-w-full truncate" style={{ fontSize: '1.25em' }}>
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
                {card.availabilityStatus === 'available' ? 'Disponível' :
                 card.availabilityStatus === 'busy' ? 'Ocupado' : 'Indisponível'}
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
          <div className={linkLayout === 'grid' ? 'w-full grid grid-cols-3 gap-2' : 'w-full flex flex-col gap-2.5'} style={linkLayout === 'grid' ? { gridAutoFlow: 'dense', gridAutoRows: 'minmax(56px, auto)' } : undefined}>
            {(card.socialLinks || []).map((link, i) => {
              // Header separator — full width in grid
              if (link.platform === 'header' || link.linkType === 'header') {
                return (
                  <div key={i} className={`font-semibold text-white/40 uppercase tracking-wider mt-2 mb-1 text-left px-1 truncate ${linkLayout === 'grid' ? 'col-span-3' : ''}`} style={{ fontSize: '0.75em' }}>
                    {link.label}
                  </div>
                );
              }

              const Icon = platformIcons[link.platform] || Globe;
              const platColor = platformColors[link.platform] || accent;
              const meta = parseMetadata(link.metadata);
              const blockShape = meta.buttonShape || 'default';
              const blockTexture = meta.buttonTexture || 'none';
              const buttonSkinUrl = meta.buttonSkinUrl || '';
              const hasSkin = !!buttonSkinUrl && buttonSkinUrl !== 'none';

              // Determine effective style: per-link shape overrides global
              const effectiveStyle = blockShape !== 'default' ? blockShape : linkStyle;
              const isOutline = effectiveStyle === 'outline';
              const isGhost = effectiveStyle === 'ghost';
              const isNeonBorder = effectiveStyle === 'neon-border';
              const noLeftBorder = isOutline || isGhost || isNeonBorder || effectiveStyle === 'ticket';

              if (linkLayout === 'grid') {
                const gic = getPreviewIconStyle(iconStyle, platColor, accent);
                const gs = getGridSize(link.metadata);
                const gridRadius = getPreviewShapeRadius(effectiveStyle !== 'default' ? effectiveStyle : 'rounded');

                // Grid background + border based on effective style
                const gridBg = (() => {
                  switch (effectiveStyle) {
                    case 'ghost': return 'transparent';
                    case 'outline': return 'transparent';
                    case 'glassmorphism': return 'rgba(255,255,255,0.07)';
                    case 'neon-border': return 'rgba(255,255,255,0.03)';
                    case 'elevated': return 'rgba(255,255,255,0.08)';
                    default: return `${platColor}12`;
                  }
                })();
                const gridBorder = (() => {
                  switch (effectiveStyle) {
                    case 'outline': return `1px solid ${accent}60`;
                    case 'neon-border': return `1px solid ${accent}60`;
                    case 'ghost': return 'none';
                    case 'brutalist': return `2px solid ${accent}`;
                    default: return `1px solid ${platColor}20`;
                  }
                })();

                return (
                  <motion.div
                    key={i}
                    whileHover={getHoverAnim(linkAnimation)}
                    whileTap={{ scale: 0.98 }}
                    className={`flex flex-col items-center justify-center gap-1 py-3 px-1 text-white transition-all cursor-pointer relative overflow-hidden group ${
                      effectiveStyle === 'glassmorphism' ? 'backdrop-blur-md' : ''
                    } ${effectiveStyle === 'elevated' ? 'shadow-lg shadow-black/30' : ''}`}
                    style={{
                      backgroundColor: gridBg,
                      border: gridBorder,
                      borderRadius: gridRadius,
                      gridColumn: `span ${gs.cols}`,
                      gridRow: `span ${gs.rows}`,
                      ...(effectiveStyle === 'brutalist' ? { boxShadow: `2px 2px 0 ${accent}40` } : {}),
                      ...(effectiveStyle === 'neon-border' ? { boxShadow: `0 0 6px ${accent}30, inset 0 0 6px ${accent}08` } : {}),
                    }}
                  >
                    {hasSkin && <div className="absolute inset-0 pointer-events-none transition-transform duration-300 group-hover:scale-105" style={{ background: getPreviewSkinBg(buttonSkinUrl, accent) }} />}
                    {!hasSkin && blockTexture !== 'none' && <div className="absolute inset-0 pointer-events-none" style={getPreviewTextureStyle(blockTexture, accent)} />}
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center relative z-[1]" style={gic.style}>
                      <Icon size={16} className="shrink-0" style={{ color: gic.iconColor }} />
                    </div>
                    <span
                      className={`text-[9px] truncate max-w-full text-center leading-tight relative z-[1] ${meta.textBold === '1' ? 'font-bold' : ''} ${meta.textUppercase === '1' ? 'uppercase' : ''}`}
                      style={{ color: meta.textColor || 'rgba(255,255,255,0.6)', ...(meta.textItalic === '1' ? { fontStyle: 'italic' } : {}) }}
                    >
                      {link.label || 'Link'}
                    </span>
                  </motion.div>
                );
              }

              const listRadius = getPreviewShapeRadius(blockShape);
              // When a per-link shape override exists, use per-link classes; otherwise global linkClass
              const effectiveLinkClass = blockShape !== 'default'
                ? getLinkClasses(blockShape)
                : linkClass;

              return (
                <motion.div
                  key={i}
                  whileHover={getHoverAnim(linkAnimation)}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-4 py-3 text-white font-medium transition-all cursor-pointer relative overflow-hidden ${effectiveLinkClass} ${linkAnimation === 'glow' ? 'hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]' : ''}`}
                  style={{
                    fontSize: '0.875em',
                    // Only override bg/border via inline for special styles that need accent color
                    borderLeft: !noLeftBorder && effectiveStyle !== 'elevated' && effectiveStyle !== 'glassmorphism' ? `3px solid ${accent}` : undefined,
                    ...(isOutline ? { borderColor: `${accent}60` } : {}),
                    ...(isNeonBorder ? { borderColor: `${accent}60`, boxShadow: `0 0 6px ${accent}30, inset 0 0 6px ${accent}08` } : {}),
                    ...(blockShape !== 'default' ? { borderRadius: listRadius } : {}),
                    ...(blockShape === 'brutalist' ? { border: `2px solid ${accent}`, boxShadow: `2px 2px 0 ${accent}40` } : {}),
                    ...(effectiveStyle === 'ticket' ? { borderRadius: '16px 4px 4px 16px' } : {}),
                    ...(effectiveStyle === 'leaf' ? { borderRadius: '20px 4px 20px 4px' } : {}),
                  }}
                >
                  {hasSkin && <div className="absolute inset-0 pointer-events-none transition-transform duration-300 group-hover:scale-105" style={{ background: getPreviewSkinBg(buttonSkinUrl, accent) }} />}
                  {!hasSkin && blockTexture !== 'none' && <div className="absolute inset-0 pointer-events-none" style={getPreviewTextureStyle(blockTexture, accent)} />}
                  {(() => { const lic = getPreviewIconStyle(iconStyle, platColor, accent); return (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 relative z-[1]" style={lic.style}>
                      <Icon size={14} style={{ color: lic.iconColor }} />
                    </div>
                  ); })()}
                  <span
                    className={`truncate min-w-0 relative z-[1] ${meta.textBold === '1' ? 'font-bold' : ''} ${meta.textUppercase === '1' ? 'uppercase tracking-wider' : ''}`}
                    style={{ ...(meta.textColor ? { color: meta.textColor } : {}), ...(meta.textItalic === '1' ? { fontStyle: 'italic' } : {}) }}
                  >
                    {link.label || 'Link'}
                  </span>
                  <span className="ml-auto text-white/30 relative z-[1]">&rsaquo;</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

function getPreviewShapeRadius(shape: string): string {
  switch (shape) {
    case 'pill': return '9999px';
    case 'square': return '0';
    case 'rounded': return '16px';
    case 'ticket': return '16px 4px 4px 16px';
    case 'leaf': return '20px 4px 20px 4px';
    case 'brutalist': return '0';
    default: return '12px';
  }
}

function getPreviewTextureStyle(texture: string, accent: string): React.CSSProperties {
  switch (texture) {
    case 'glass':
      return { background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)' };
    case 'noise':
      return { backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`, backgroundSize: '100px 100px' };
    case 'gradient-shine':
      return { background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 55%, transparent 60%)' };
    case 'brushed':
      return { background: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)' };
    case 'frosted':
      return { background: 'rgba(255,255,255,0.06)' };
    case 'holographic':
      return { background: `linear-gradient(135deg, ${accent}15, rgba(255,0,128,0.08), rgba(0,200,255,0.08), ${accent}15)` };
    default:
      return {};
  }
}

function getPreviewSkinBg(skin: string, accent: string): string {
  switch (skin) {
    case 'watercolor': return `linear-gradient(135deg, ${accent}40, #ff6b9d30, ${accent}20)`;
    case 'neon-glow': return `linear-gradient(135deg, ${accent}80, #0f0f23, ${accent}60)`;
    case 'wood': return 'linear-gradient(135deg, #8B6914, #A0522D, #6B4226)';
    case 'marble': return 'linear-gradient(135deg, #e8e8e8, #c9c9c9, #f5f5f5, #d0d0d0)';
    case 'paper': return 'linear-gradient(135deg, #f5e6d3, #e8d5b7, #f0dfc8)';
    case 'metal': return 'linear-gradient(135deg, #4a4a4a, #6a6a6a, #3a3a3a, #5a5a5a)';
    case 'gradient-mesh': return `linear-gradient(135deg, ${accent}, #E84393, #6C5CE7, ${accent})`;
    default: return `linear-gradient(135deg, ${accent}30, ${accent}10)`;
  }
}

function isLightHex(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 180;
}

function getPreviewIconStyle(iconStyle: string, bgColor: string, accent: string): { style: React.CSSProperties; iconColor: string } {
  const solidIcon = isLightHex(bgColor) ? '#1a1a2e' : '#ffffff';
  const outlineIcon = isLightHex(bgColor) ? accent : bgColor;

  switch (iconStyle) {
    case 'filled':
      return { style: { backgroundColor: bgColor }, iconColor: solidIcon };
    case 'outline':
      return { style: { border: `2px solid ${bgColor}`, backgroundColor: 'transparent' }, iconColor: outlineIcon };
    case 'neomorph':
      return { style: { backgroundColor: 'rgba(255,255,255,0.08)', boxShadow: `3px 3px 6px rgba(0,0,0,0.3), -1px -1px 4px rgba(255,255,255,0.05), inset 0 0 0 1px ${bgColor}30` }, iconColor: outlineIcon };
    case 'glass':
      return { style: { backgroundColor: `${bgColor}15`, border: `1px solid ${bgColor}30` }, iconColor: outlineIcon };
    case 'gradient':
      return { style: { background: `linear-gradient(135deg, ${bgColor}, ${bgColor}88)` }, iconColor: solidIcon };
    case 'neon':
      return { style: { backgroundColor: 'transparent', border: `1.5px solid ${bgColor}`, boxShadow: `0 0 6px ${bgColor}60, 0 0 16px ${bgColor}25, inset 0 0 6px ${bgColor}15` }, iconColor: outlineIcon };
    case 'shadow':
      return { style: { backgroundColor: bgColor, boxShadow: `0 3px 10px ${bgColor}50, 0 1px 4px rgba(0,0,0,0.3)` }, iconColor: solidIcon };
    case 'minimal':
      return { style: { backgroundColor: 'transparent' }, iconColor: outlineIcon };
    case 'circle':
      return { style: { backgroundColor: `${bgColor}18`, borderRadius: '50%' }, iconColor: outlineIcon };
    case 'soft':
      return { style: { backgroundColor: `${bgColor}12`, border: `1px solid ${bgColor}10` }, iconColor: outlineIcon };
    case 'default':
    default:
      return { style: { backgroundColor: `${accent}20` }, iconColor: outlineIcon };
  }
}

function PreviewPatternSvg({ pattern, accent }: { pattern: string; accent: string }) {
  const color = `${accent}30`;
  switch (pattern) {
    case 'dots':
      return (
        <svg width="100%" height="100%">
          <pattern id="prev-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.5" fill={color} />
          </pattern>
          <rect width="100%" height="100%" fill="url(#prev-dots)" />
        </svg>
      );
    case 'grid':
      return (
        <svg width="100%" height="100%">
          <pattern id="prev-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={color} strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#prev-grid)" />
        </svg>
      );
    case 'waves':
      return (
        <svg width="100%" height="100%">
          <pattern id="prev-waves" width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M0 10 Q10 0 20 10 T40 10" fill="none" stroke={color} strokeWidth="0.8" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#prev-waves)" />
        </svg>
      );
    case 'hexagons':
      return (
        <svg width="100%" height="100%">
          <pattern id="prev-hex" width="34" height="40" patternUnits="userSpaceOnUse">
            <path d="M17 0 L34 10 L34 30 L17 40 L0 30 L0 10 Z" fill="none" stroke={color} strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#prev-hex)" />
        </svg>
      );
    case 'circuit':
      return (
        <svg width="100%" height="100%">
          <pattern id="prev-circuit" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M5 5 H20 V15 H35 M10 25 H25 V35" fill="none" stroke={color} strokeWidth="0.5" />
            <circle cx="5" cy="5" r="1.5" fill={color} />
            <circle cx="35" cy="15" r="1.5" fill={color} />
          </pattern>
          <rect width="100%" height="100%" fill="url(#prev-circuit)" />
        </svg>
      );
    case 'zigzag':
      return (
        <svg width="100%" height="100%">
          <pattern id="prev-zigzag" width="16" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 4 L4 0 L8 4 L12 0 L16 4" fill="none" stroke={color} strokeWidth="0.6" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#prev-zigzag)" />
        </svg>
      );
    default:
      return null;
  }
}
