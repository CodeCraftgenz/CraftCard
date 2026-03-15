import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Instagram, Linkedin, Github, Globe, Mail, MessageCircle,
  Youtube, Twitter, Music2, Link as LinkIcon, ExternalLink,
  Phone, FileDown, MapPin, Play, Minus, Copy, Check,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { trackLinkClick } from '@/hooks/useAnalytics';
import { generatePixPayload } from '@/lib/pix-generator';
import { getGridSize, parseMetadata } from '@/lib/constants';

interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  order: number;
  linkType?: string | null;
  metadata?: string | null;
}

const platformIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  youtube: Youtube,
  tiktok: Music2,
  website: Globe,
  email: Mail,
  whatsapp: MessageCircle,
  other: LinkIcon,
  custom: ExternalLink,
  header: Minus,
  pix: () => <span className="text-xs font-bold">PIX</span>,
  video_embed: Play,
  music_embed: Music2,
  file: FileDown,
  map: MapPin,
  phone: Phone,
} as unknown as Record<string, typeof Instagram>;

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

function PixExpandedSection({ pixKey, pixPayload, accent }: { pixKey: string; pixPayload: string | null; accent: string }) {
  const [keyCopied, setKeyCopied] = useState(false);
  const [payloadCopied, setPayloadCopied] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(pixKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const handleCopyPayload = () => {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    setPayloadCopied(true);
    setTimeout(() => setPayloadCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="mt-2 p-4 rounded-xl bg-white/5 border border-white/10 text-center"
    >
      {pixPayload && (
        <div className="mb-3 flex justify-center">
          <div className="p-3 bg-white rounded-xl">
            <QRCodeCanvas value={pixPayload} size={160} level="M" fgColor="#000000" bgColor="#FFFFFF" />
          </div>
        </div>
      )}
      <p className="text-xs text-white/50 mb-1">Chave Pix</p>
      <p className="text-sm text-white font-mono bg-white/10 px-3 py-2 rounded-lg break-all">{pixKey}</p>
      <div className="mt-2 flex items-center justify-center gap-3">
        <button type="button" onClick={handleCopyKey} className="flex items-center gap-1 text-xs hover:text-white transition-colors" style={{ color: accent }}>
          {keyCopied ? <Check size={12} /> : <Copy size={12} />}
          {keyCopied ? 'Copiado!' : 'Copiar chave'}
        </button>
        {pixPayload && (
          <button type="button" onClick={handleCopyPayload} className="flex items-center gap-1 text-xs hover:text-white transition-colors" style={{ color: accent }}>
            {payloadCopied ? <Check size={12} /> : <Copy size={12} />}
            {payloadCopied ? 'Copiado!' : 'Copia e Cola'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

interface LinkRendererProps {
  link: SocialLink;
  index: number;
  accent: string;
  linkStyle: string;
  linkAnim: string;
  iconStyle?: string;
}

export function LinkRenderer({ link, index, accent, linkStyle, linkAnim, iconStyle = 'default' }: LinkRendererProps) {
  const [embedOpen, setEmbedOpen] = useState(false);

  // Header separator
  if (link.platform === 'header' || link.linkType === 'header') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.08 }}
        className="flex items-center gap-3 py-2"
      >
        <div className="flex-1 h-px bg-white/10" />
        <span className="font-semibold text-white/40 uppercase tracking-wider truncate max-w-[60%]" style={{ fontSize: '0.75em' }}>{link.label}</span>
        <div className="flex-1 h-px bg-white/10" />
      </motion.div>
    );
  }

  // Phone link
  if (link.platform === 'phone') {
    return (
      <LinkButton
        link={link}
        href={link.url.startsWith('tel:') ? link.url : `tel:${link.url}`}
        index={index}
        accent={accent}
        linkStyle={linkStyle}
        linkAnim={linkAnim}
        iconStyle={iconStyle}
      />
    );
  }

  // Video Embed
  if (link.platform === 'video_embed') {
    const videoId = extractYouTubeId(link.url);
    return (
      <div>
        <LinkButton
          link={link}
          href={link.url}
          index={index}
          accent={accent}
          linkStyle={linkStyle}
          linkAnim={linkAnim}
          iconStyle={iconStyle}
          onClick={(e) => {
            if (videoId) {
              e.preventDefault();
              setEmbedOpen(!embedOpen);
            }
          }}
        />
        {embedOpen && videoId && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-2 rounded-xl overflow-hidden"
          >
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              className="w-full aspect-video rounded-xl"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={link.label}
            />
          </motion.div>
        )}
      </div>
    );
  }

  // Music Embed
  if (link.platform === 'music_embed') {
    const spotifyUri = extractSpotifyUri(link.url);
    return (
      <div>
        <LinkButton
          link={link}
          href={link.url}
          index={index}
          accent={accent}
          linkStyle={linkStyle}
          linkAnim={linkAnim}
          iconStyle={iconStyle}
          onClick={(e) => {
            if (spotifyUri) {
              e.preventDefault();
              setEmbedOpen(!embedOpen);
            }
          }}
        />
        {embedOpen && spotifyUri && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-2 rounded-xl overflow-hidden"
          >
            <iframe
              src={`https://open.spotify.com/embed/${spotifyUri}`}
              className="w-full h-20 rounded-xl"
              allow="encrypted-media"
              title={link.label}
            />
          </motion.div>
        )}
      </div>
    );
  }

  // Pix QR Code
  if (link.platform === 'pix') {
    const meta = link.metadata ? tryParseJson(link.metadata) : null;
    const pixKey = meta?.pixKey || null;
    const pixName = meta?.pixName || 'Pagamento';
    const pixCity = meta?.pixCity || 'SaoPaulo';
    const pixAmount = meta?.pixAmount || '';

    const pixPayload = pixKey
      ? generatePixPayload({
          pixKey,
          merchantName: pixName,
          merchantCity: pixCity,
          amount: pixAmount,
        })
      : null;

    return (
      <div>
        <LinkButton
          link={{ ...link, url: '#' }}
          href="#"
          index={index}
          accent={accent}
          linkStyle={linkStyle}
          linkAnim={linkAnim}
          iconStyle={iconStyle}
          onClick={(e) => {
            e.preventDefault();
            setEmbedOpen(!embedOpen);
          }}
        />
        {embedOpen && pixKey && (
          <PixExpandedSection
            pixKey={pixKey}
            pixPayload={pixPayload}
            accent={accent}
          />
        )}
      </div>
    );
  }

  // Map — show inline embedded map visual
  if (link.platform === 'map') {
    const query = link.url.startsWith('http') ? '' : encodeURIComponent(link.url);
    const embedUrl = link.url.startsWith('http')
      ? link.url
      : `https://www.google.com/maps?q=${query}&output=embed`;
    const mapsLink = link.url.startsWith('http')
      ? link.url
      : `https://maps.google.com/?q=${query}`;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        className="rounded-2xl overflow-hidden relative"
        style={{ border: `1px solid ${accent}20` }}
      >
        <iframe
          src={embedUrl}
          className="w-full h-48 border-0"
          loading="lazy"
          title={link.label}
          allowFullScreen
        />
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackLinkClick(link.id)}
          className="absolute top-0 left-0 z-10"
        >
          <div className="m-2.5 px-3 py-1.5 rounded-xl shadow-sm backdrop-blur-sm" style={{ backgroundColor: `${accent}cc` }}>
            <span className="text-xs font-semibold text-white drop-shadow">{link.label}</span>
          </div>
        </a>
      </motion.div>
    );
  }

  // File download
  if (link.platform === 'file') {
    return (
      <LinkButton
        link={link}
        href={link.url}
        index={index}
        accent={accent}
        linkStyle={linkStyle}
        linkAnim={linkAnim}
        iconStyle={iconStyle}
        download
      />
    );
  }

  // Default: regular link
  return (
    <LinkButton
      link={link}
      href={link.url}
      index={index}
      accent={accent}
      linkStyle={linkStyle}
      linkAnim={linkAnim}
      iconStyle={iconStyle}
    />
  );
}

// Shared link button component
function LinkButton({
  link, href, index, accent, linkStyle, linkAnim, iconStyle = 'default', onClick, download,
}: {
  link: SocialLink;
  href: string;
  index: number;
  accent: string;
  linkStyle: string;
  linkAnim: string;
  iconStyle?: string;
  onClick?: (e: React.MouseEvent) => void;
  download?: boolean;
}) {
  const Icon = platformIcons[link.platform] || Globe;
  const bgColor = platformColors[link.platform] || accent;
  const isMailto = href.startsWith('mailto:');
  const isInternal = href === '#';
  const iconContainer = getIconContainerStyle(iconStyle, bgColor, accent);

  // Per-link overrides from metadata
  const meta = parseMetadata(link.metadata);
  const blockShape = meta.buttonShape || 'default';
  const blockTexture = meta.buttonTexture || 'none';
  const buttonSkinUrl = meta.buttonSkinUrl || '';
  const hasSkin = !!buttonSkinUrl;
  const effectiveStyle = blockShape !== 'default' ? blockShape : linkStyle;
  const shapeClass = getShapeClass(effectiveStyle, linkStyle);
  const textureStyle = getTextureStyle(blockTexture, accent);
  const skinBg = hasSkin ? getSkinBackground(buttonSkinUrl, accent) : null;

  return (
    <motion.a
      href={href}
      {...(!isMailto && !isInternal && { target: '_blank', rel: 'noopener noreferrer' })}
      {...(download && { download: true })}
      onClick={(e) => {
        trackLinkClick(link.id);
        onClick?.(e);
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={getHoverAnim(linkAnim)}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center gap-4 px-5 py-3.5 backdrop-blur-xl text-white transition-all group relative overflow-hidden ${hasSkin ? getShapeClass(effectiveStyle, 'rounded') : shapeClass}`}
      style={{
        ...(hasSkin ? {} : {
          borderLeft: effectiveStyle !== 'ghost' && effectiveStyle !== 'neon-border' && effectiveStyle !== 'ticket' ? `3px solid ${accent}` : undefined,
          ...(effectiveStyle === 'neon-border' ? { border: `1px solid ${accent}60`, boxShadow: `0 0 8px ${accent}30, inset 0 0 8px ${accent}08` } : {}),
          ...getShapeInlineStyle(effectiveStyle, accent),
        }),
      }}
    >
      {/* Skin background (premium PNG or preset gradient) */}
      {skinBg && (
        skinBg.type === 'image' ? (
          <img
            src={skinBg.value}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
          />
        ) : (
          <div
            className="absolute inset-0 pointer-events-none transition-transform duration-300 group-hover:scale-105"
            style={{ background: skinBg.value }}
          />
        )
      )}
      {/* Texture overlay */}
      {!hasSkin && blockTexture !== 'none' && <div className="absolute inset-0 pointer-events-none" style={textureStyle} />}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative z-[1] ${iconContainer.className}`}
        style={iconContainer.style}
      >
        <Icon size={20} style={{ color: iconContainer.iconColor }} />
      </div>
      <span
        className={`truncate min-w-0 relative z-[1] ${meta.textBold === '1' ? 'font-bold' : 'font-medium'} ${meta.textUppercase === '1' ? 'uppercase tracking-wider' : ''}`}
        style={{
          fontSize: '0.875em',
          ...(meta.textColor ? { color: meta.textColor } : {}),
          ...(meta.textItalic === '1' ? { fontStyle: 'italic' } : {}),
        }}
      >
        {link.label}
      </span>
      <span className="ml-auto text-white/20 group-hover:text-white/40 transition-colors relative z-[1]">&rsaquo;</span>
    </motion.a>
  );
}

/** Check if a hex color is "light" (would be invisible on white/light bg) */
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  // Perceived brightness formula
  return (r * 299 + g * 587 + b * 114) / 1000 > 180;
}

function getIconContainerStyle(iconStyle: string, bgColor: string, accent: string): { style: React.CSSProperties; className: string; iconColor: string } {
  // For styles with solid bg, use dark icon if bgColor is light (prevents white-on-white)
  const solidIconColor = isLightColor(bgColor) ? '#1a1a2e' : '#ffffff';

  switch (iconStyle) {
    case 'filled':
      return { style: { backgroundColor: bgColor }, className: '', iconColor: solidIconColor };
    case 'outline':
      return { style: { border: `2px solid ${bgColor}`, backgroundColor: 'transparent' }, className: '', iconColor: isLightColor(bgColor) ? accent : bgColor };
    case 'neomorph':
      return { style: { backgroundColor: 'rgba(255,255,255,0.08)', boxShadow: `4px 4px 8px rgba(0,0,0,0.3), -2px -2px 6px rgba(255,255,255,0.05), inset 0 0 0 1px ${bgColor}30` }, className: '', iconColor: isLightColor(bgColor) ? accent : bgColor };
    case 'glass':
      return { style: { backgroundColor: `${bgColor}15`, border: `1px solid ${bgColor}30`, boxShadow: `0 2px 8px ${bgColor}20`, backdropFilter: 'blur(8px)' }, className: '', iconColor: isLightColor(bgColor) ? accent : bgColor };
    case 'gradient':
      return { style: { background: `linear-gradient(135deg, ${bgColor}, ${bgColor}88)` }, className: '', iconColor: solidIconColor };
    case 'neon':
      return { style: { backgroundColor: 'transparent', border: `1.5px solid ${bgColor}`, boxShadow: `0 0 8px ${bgColor}60, 0 0 20px ${bgColor}25, inset 0 0 8px ${bgColor}15` }, className: '', iconColor: isLightColor(bgColor) ? accent : bgColor };
    case 'shadow':
      return { style: { backgroundColor: bgColor, boxShadow: `0 4px 14px ${bgColor}50, 0 2px 6px rgba(0,0,0,0.3)` }, className: '', iconColor: solidIconColor };
    case 'minimal':
      return { style: { backgroundColor: 'transparent' }, className: '', iconColor: isLightColor(bgColor) ? accent : bgColor };
    case 'circle':
      return { style: { backgroundColor: `${bgColor}18`, borderRadius: '50%' }, className: '!rounded-full', iconColor: isLightColor(bgColor) ? accent : bgColor };
    case 'soft':
      return { style: { backgroundColor: `${bgColor}12`, border: `1px solid ${bgColor}10` }, className: '', iconColor: isLightColor(bgColor) ? accent : bgColor };
    case 'default':
    default:
      return { style: { backgroundColor: `${accent}20` }, className: '', iconColor: isLightColor(bgColor) ? accent : bgColor };
  }
}

function getShapeClass(shape: string, fallbackStyle: string): string {
  switch (shape) {
    case 'pill': return 'rounded-full bg-white/5 border border-white/10 hover:bg-white/10';
    case 'square': return 'rounded-none bg-white/5 border border-white/10 hover:bg-white/10';
    case 'rounded': return 'rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10';
    case 'ticket': return 'bg-white/5 border border-white/10 hover:bg-white/10';
    case 'leaf': return 'bg-white/5 border border-white/10 hover:bg-white/10';
    case 'brutalist': return 'rounded-none bg-white/5 hover:bg-white/10';
    default: return getStyleClass(fallbackStyle);
  }
}

function getShapeInlineStyle(shape: string, accent: string): React.CSSProperties {
  switch (shape) {
    case 'ticket':
      return { borderRadius: '16px 4px 4px 16px' };
    case 'leaf':
      return { borderRadius: '20px 4px 20px 4px' };
    case 'brutalist':
      return { border: `2px solid ${accent}`, boxShadow: `3px 3px 0 ${accent}40` };
    default:
      return {};
  }
}

function getTextureStyle(texture: string, accent: string): React.CSSProperties {
  switch (texture) {
    case 'glass':
      return { background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)', backdropFilter: 'blur(4px)' };
    case 'noise':
      return { backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`, backgroundSize: '100px 100px' };
    case 'gradient-shine':
      return { background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 55%, transparent 60%)', backgroundSize: '200% 100%', animation: 'shimmer 3s infinite linear' };
    case 'brushed':
      return { background: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)' };
    case 'frosted':
      return { background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px) saturate(120%)' };
    case 'holographic':
      return { background: `linear-gradient(135deg, ${accent}15, rgba(255,0,128,0.08), rgba(0,200,255,0.08), ${accent}15)`, backgroundSize: '300% 300%', animation: 'hologram 4s ease infinite' };
    default:
      return {};
  }
}

function getStyleClass(style: string): string {
  switch (style) {
    case 'pill': return 'rounded-full bg-white/5 border border-white/10 hover:bg-white/10';
    case 'square': return 'rounded-none bg-white/5 border border-white/10 hover:bg-white/10';
    case 'outline': return 'rounded-2xl bg-transparent border border-white/20 hover:bg-white/5';
    case 'ghost': return 'rounded-2xl bg-transparent border-none hover:bg-white/5';
    case 'elevated': return 'rounded-2xl bg-white/8 border border-white/5 shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-black/40 hover:bg-white/10';
    case 'glassmorphism': return 'rounded-2xl bg-white/[0.07] backdrop-blur-md border border-white/15 hover:bg-white/[0.12]';
    case 'neon-border': return 'rounded-2xl bg-white/[0.03] border border-white/20 hover:bg-white/[0.06]';
    case 'rounded':
    default: return 'rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10';
  }
}

/** Resolves a skin value to either a CSS gradient (preset) or an image URL */
function getSkinBackground(skin: string, accent: string): { type: 'gradient' | 'image'; value: string } | null {
  if (!skin || skin === 'none') return null;
  // Preset skins — CSS gradients
  switch (skin) {
    case 'watercolor':
      return { type: 'gradient', value: `linear-gradient(135deg, ${accent}40, #ff6b9d30, ${accent}20)` };
    case 'neon-glow':
      return { type: 'gradient', value: `linear-gradient(135deg, ${accent}80, #0f0f23, ${accent}60)` };
    case 'wood':
      return { type: 'gradient', value: 'linear-gradient(135deg, #8B6914, #A0522D, #6B4226)' };
    case 'marble':
      return { type: 'gradient', value: 'linear-gradient(135deg, #e8e8e8, #c9c9c9, #f5f5f5, #d0d0d0)' };
    case 'paper':
      return { type: 'gradient', value: 'linear-gradient(135deg, #f5e6d3, #e8d5b7, #f0dfc8)' };
    case 'metal':
      return { type: 'gradient', value: 'linear-gradient(135deg, #4a4a4a, #6a6a6a, #3a3a3a, #5a5a5a)' };
    case 'gradient-mesh':
      return { type: 'gradient', value: `linear-gradient(135deg, ${accent}, #E84393, #6C5CE7, ${accent})` };
    default:
      // Custom URL — treat as image
      if (skin.startsWith('http') || skin.startsWith('/')) {
        return { type: 'image', value: skin };
      }
      return null;
  }
}

function getHoverAnim(anim: string): Record<string, number> {
  switch (anim) {
    case 'scale': return { scale: 1.04 };
    case 'slide': return { x: 6 };
    case 'glow': return { scale: 1.02 };
    default: return { scale: 1.02 };
  }
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

function extractSpotifyUri(url: string): string | null {
  const match = url.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
  return match ? `${match[1]}/${match[2]}` : null;
}

function tryParseJson(str: string): Record<string, string> | null {
  try { return JSON.parse(str); } catch { return null; }
}

// ──────────────────────────────────────────────
// Grid Card Layout for links
// ──────────────────────────────────────────────

function GridLinkCard({
  link, href, index, accent, linkStyle = 'rounded', linkAnim, iconStyle = 'default', onClick,
}: {
  link: SocialLink;
  href: string;
  index: number;
  accent: string;
  linkStyle?: string;
  linkAnim: string;
  iconStyle?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const Icon = platformIcons[link.platform] || Globe;
  const bgColor = platformColors[link.platform] || accent;
  const isMailto = href.startsWith('mailto:');
  const isInternal = href === '#';
  const iconContainer = getIconContainerStyle(iconStyle, bgColor, accent);
  const gs = getGridSize(link.metadata);

  // Per-link overrides from metadata
  const meta = parseMetadata(link.metadata);
  const blockShape = meta.buttonShape || 'default';
  const blockTexture = meta.buttonTexture || 'none';
  const buttonSkinUrl = meta.buttonSkinUrl || '';
  const hasSkin = !!buttonSkinUrl && buttonSkinUrl !== 'none';
  const effectiveStyle = blockShape !== 'default' ? blockShape : linkStyle;
  const textureStyle = getTextureStyle(blockTexture, accent);
  const skinBg = hasSkin ? getSkinBackground(buttonSkinUrl, accent) : null;

  // Grid shape radius respects effectiveStyle (global linkStyle fallback)
  const gridShapeRadius = (() => {
    switch (effectiveStyle) {
      case 'pill': return '9999px';
      case 'square': case 'brutalist': return '0';
      case 'rounded': return '16px';
      case 'ticket': return '16px 4px 4px 16px';
      case 'leaf': return '20px 4px 20px 4px';
      case 'outline': case 'ghost': case 'elevated': case 'glassmorphism': case 'neon-border': return '16px';
      default: return '16px';
    }
  })();

  // Grid background + border based on effective style
  const gridBg = (() => {
    switch (effectiveStyle) {
      case 'ghost': return 'transparent';
      case 'outline': return 'transparent';
      case 'glassmorphism': return `rgba(255,255,255,0.07)`;
      case 'neon-border': return `rgba(255,255,255,0.03)`;
      case 'elevated': return `rgba(255,255,255,0.08)`;
      default: return `${bgColor}12`;
    }
  })();

  const gridBorder = (() => {
    switch (effectiveStyle) {
      case 'outline': return `1px solid ${accent}60`;
      case 'neon-border': return `1px solid ${accent}60`;
      case 'ghost': return 'none';
      case 'brutalist': return `2px solid ${accent}`;
      default: return `1px solid ${bgColor}20`;
    }
  })();

  return (
    <motion.a
      href={href}
      {...(!isMailto && !isInternal && { target: '_blank', rel: 'noopener noreferrer' })}
      onClick={(e) => {
        trackLinkClick(link.id);
        onClick?.(e);
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={getHoverAnim(linkAnim)}
      whileTap={{ scale: 0.95 }}
      className={`flex flex-col items-center justify-center gap-1.5 py-4 px-2 text-white transition-all group relative overflow-hidden ${
        effectiveStyle === 'glassmorphism' ? 'backdrop-blur-md' : ''
      } ${effectiveStyle === 'elevated' ? 'shadow-lg shadow-black/30' : ''}`}
      style={{
        backgroundColor: gridBg,
        border: gridBorder,
        borderRadius: gridShapeRadius,
        gridColumn: `span ${gs.cols}`,
        gridRow: `span ${gs.rows}`,
        ...(effectiveStyle === 'brutalist' ? { boxShadow: `3px 3px 0 ${accent}40` } : {}),
        ...(effectiveStyle === 'neon-border' ? { boxShadow: `0 0 8px ${accent}30, inset 0 0 8px ${accent}08` } : {}),
      }}
    >
      {/* Skin background */}
      {skinBg && (
        skinBg.type === 'image' ? (
          <img src={skinBg.value} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 pointer-events-none transition-transform duration-300 group-hover:scale-105" style={{ background: skinBg.value }} />
        )
      )}
      {!hasSkin && blockTexture !== 'none' && <div className="absolute inset-0 pointer-events-none" style={textureStyle} />}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative z-[1] ${iconContainer.className}`} style={iconContainer.style}>
        <Icon size={gs.cols >= 2 || gs.rows >= 2 ? 32 : 24} style={{ color: iconContainer.iconColor }} />
      </div>
      <span
        className={`truncate max-w-full text-center leading-tight relative z-[1] ${gs.cols >= 2 ? 'text-sm' : 'text-[11px]'} ${meta.textBold === '1' ? 'font-bold' : 'font-medium'} ${meta.textUppercase === '1' ? 'uppercase tracking-wider' : ''}`}
        style={{
          color: meta.textColor || 'rgba(255,255,255,0.7)',
          ...(meta.textItalic === '1' ? { fontStyle: 'italic' } : {}),
        }}
      >
        {link.label}
      </span>
    </motion.a>
  );
}

export function GridLinkRenderer({ link, index, accent, linkStyle, linkAnim, iconStyle = 'default' }: LinkRendererProps) {
  const [embedOpen, setEmbedOpen] = useState(false);

  // Header separator — full width
  if (link.platform === 'header' || link.linkType === 'header') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.06 }}
        className="col-span-3 flex items-center gap-3 py-2"
      >
        <div className="flex-1 h-px bg-white/10" />
        <span className="font-semibold text-white/40 uppercase tracking-wider truncate max-w-[60%]" style={{ fontSize: '0.75em' }}>{link.label}</span>
        <div className="flex-1 h-px bg-white/10" />
      </motion.div>
    );
  }

  // Pix — needs expand behavior, use gridSize or default to full width
  if (link.platform === 'pix') {
    const meta = link.metadata ? tryParseJson(link.metadata) : null;
    const pixKey = meta?.pixKey || null;
    const pixName = meta?.pixName || 'Pagamento';
    const pixCity = meta?.pixCity || 'SaoPaulo';
    const pixAmount = meta?.pixAmount || '';

    const pixPayload = pixKey
      ? generatePixPayload({ pixKey, merchantName: pixName, merchantCity: pixCity, amount: pixAmount })
      : null;

    const pixGs = getGridSize(link.metadata);
    return (
      <div style={{ gridColumn: embedOpen ? 'span 3' : `span ${pixGs.cols}`, gridRow: `span ${pixGs.rows}` }}>
        <GridLinkCard
          link={{ ...link, url: '#' }}
          href="#"
          index={index}
          accent={accent}
          linkStyle={linkStyle}
          linkAnim={linkAnim}
          iconStyle={iconStyle}
          onClick={(e) => { e.preventDefault(); setEmbedOpen(!embedOpen); }}
        />
        {embedOpen && pixKey && <PixExpandedSection pixKey={pixKey} pixPayload={pixPayload} accent={accent} />}
      </div>
    );
  }

  // Video embed
  if (link.platform === 'video_embed') {
    const videoId = extractYouTubeId(link.url);
    const vidGs = getGridSize(link.metadata);
    return (
      <div style={{ gridColumn: embedOpen && videoId ? 'span 3' : `span ${vidGs.cols}`, gridRow: `span ${vidGs.rows}` }}>
        <GridLinkCard
          link={link} href={link.url} index={index} accent={accent} linkStyle={linkStyle} linkAnim={linkAnim} iconStyle={iconStyle}
          onClick={(e) => { if (videoId) { e.preventDefault(); setEmbedOpen(!embedOpen); } }}
        />
        {embedOpen && videoId && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-2 rounded-xl overflow-hidden col-span-3">
            <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} className="w-full aspect-video rounded-xl" allow="autoplay; encrypted-media" allowFullScreen title={link.label} />
          </motion.div>
        )}
      </div>
    );
  }

  // Music embed
  if (link.platform === 'music_embed') {
    const spotifyUri = extractSpotifyUri(link.url);
    const musGs = getGridSize(link.metadata);
    return (
      <div style={{ gridColumn: embedOpen && spotifyUri ? 'span 3' : `span ${musGs.cols}`, gridRow: `span ${musGs.rows}` }}>
        <GridLinkCard
          link={link} href={link.url} index={index} accent={accent} linkStyle={linkStyle} linkAnim={linkAnim} iconStyle={iconStyle}
          onClick={(e) => { if (spotifyUri) { e.preventDefault(); setEmbedOpen(!embedOpen); } }}
        />
        {embedOpen && spotifyUri && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-2 rounded-xl overflow-hidden">
            <iframe src={`https://open.spotify.com/embed/${spotifyUri}`} className="w-full h-20 rounded-xl" allow="encrypted-media" title={link.label} />
          </motion.div>
        )}
      </div>
    );
  }

  // Phone
  if (link.platform === 'phone') {
    return <GridLinkCard link={link} href={link.url.startsWith('tel:') ? link.url : `tel:${link.url}`} index={index} accent={accent} linkStyle={linkStyle} linkAnim={linkAnim} iconStyle={iconStyle} />;
  }

  // Map — inline embedded map visual
  if (link.platform === 'map') {
    const query = link.url.startsWith('http') ? '' : encodeURIComponent(link.url);
    const embedUrl = link.url.startsWith('http')
      ? link.url
      : `https://www.google.com/maps?q=${query}&output=embed`;
    const mapsLink = link.url.startsWith('http')
      ? link.url
      : `https://maps.google.com/?q=${query}`;
    const mapGs = getGridSize(link.metadata);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        className="rounded-2xl overflow-hidden relative"
        style={{ border: `1px solid ${accent}20`, gridColumn: `span ${mapGs.cols}`, gridRow: `span ${mapGs.rows}` }}
      >
        <iframe
          src={embedUrl}
          className="w-full h-40 border-0"
          loading="lazy"
          title={link.label}
          allowFullScreen
        />
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackLinkClick(link.id)}
          className="absolute top-0 left-0 z-10"
        >
          <div className="m-2 px-2.5 py-1 rounded-lg shadow-sm backdrop-blur-sm" style={{ backgroundColor: `${accent}cc` }}>
            <span className="text-[10px] font-semibold text-white drop-shadow">{link.label}</span>
          </div>
        </a>
      </motion.div>
    );
  }

  // File
  if (link.platform === 'file') {
    return <GridLinkCard link={link} href={link.url} index={index} accent={accent} linkStyle={linkStyle} linkAnim={linkAnim} iconStyle={iconStyle} />;
  }

  // Default
  return <GridLinkCard link={link} href={link.url} index={index} accent={accent} linkStyle={linkStyle} linkAnim={linkAnim} iconStyle={iconStyle} />;
}
