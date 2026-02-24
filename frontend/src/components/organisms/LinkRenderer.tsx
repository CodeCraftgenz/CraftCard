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
}

export function LinkRenderer({ link, index, accent, linkStyle, linkAnim }: LinkRendererProps) {
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
        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">{link.label}</span>
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

  // Map
  if (link.platform === 'map') {
    return (
      <LinkButton
        link={link}
        href={link.url.startsWith('http') ? link.url : `https://maps.google.com/?q=${encodeURIComponent(link.url)}`}
        index={index}
        accent={accent}
        linkStyle={linkStyle}
        linkAnim={linkAnim}
      />
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
    />
  );
}

// Shared link button component
function LinkButton({
  link, href, index, accent, linkStyle, linkAnim, onClick, download,
}: {
  link: SocialLink;
  href: string;
  index: number;
  accent: string;
  linkStyle: string;
  linkAnim: string;
  onClick?: (e: React.MouseEvent) => void;
  download?: boolean;
}) {
  const Icon = platformIcons[link.platform] || Globe;
  const bgColor = platformColors[link.platform] || accent;
  const isMailto = href.startsWith('mailto:');
  const isInternal = href === '#';

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
      className={`flex items-center gap-4 px-5 py-3.5 backdrop-blur-xl text-white transition-all group ${getStyleClass(linkStyle)}`}
      style={{ borderLeft: linkStyle !== 'ghost' ? `3px solid ${accent}` : undefined }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${accent}20` }}
      >
        <Icon size={20} style={{ color: bgColor }} />
      </div>
      <span className="font-medium text-sm">{link.label}</span>
      <span className="ml-auto text-white/20 group-hover:text-white/40 transition-colors">&rsaquo;</span>
    </motion.a>
  );
}

function getStyleClass(style: string): string {
  switch (style) {
    case 'pill': return 'rounded-full bg-white/5 border border-white/10 hover:bg-white/10';
    case 'square': return 'rounded-none bg-white/5 border border-white/10 hover:bg-white/10';
    case 'outline': return 'rounded-2xl bg-transparent border border-white/20 hover:bg-white/5';
    case 'ghost': return 'rounded-2xl bg-transparent border-none hover:bg-white/5';
    case 'rounded':
    default: return 'rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10';
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
