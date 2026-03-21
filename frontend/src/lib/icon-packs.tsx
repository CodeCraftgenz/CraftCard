/**
 * icon-packs.tsx — Mapeamento de icones por pacote (Lucide, Brand, Filled).
 * Permite ao usuario escolher entre icones de linha, logos oficiais ou icones solidos.
 */
import type { ComponentType } from 'react';

// Lucide (default — line icons)
import {
  Instagram, Linkedin, Github, Twitter, Youtube, Globe, Mail,
  MessageCircle, ExternalLink, Music2, Play, FileDown, MapPin, Phone, Minus,
} from 'lucide-react';

// Simple Icons (brand logos)
import {
  SiInstagram, SiGithub, SiX, SiYoutube, SiWhatsapp,
  SiTiktok, SiSpotify,
} from 'react-icons/si';

// Font Awesome 6 (filled/solid)
import {
  FaInstagram, FaLinkedinIn, FaGithub, FaXTwitter, FaYoutube,
  FaWhatsapp, FaTiktok, FaGlobe, FaEnvelope, FaPhone,
  FaLink, FaPlay, FaMusic, FaFileArrowDown, FaLocationDot, FaMinus,
  FaLinkedin,
} from 'react-icons/fa6';

type IconComponent = ComponentType<any>;

/** Componente especial para PIX — nao existe icone padrao em nenhuma biblioteca */
const PixIcon: IconComponent = () => <span className="text-xs font-bold">PIX</span>;

/** Mapeamento Lucide (padrao) */
const lucideIcons: Record<string, IconComponent> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  youtube: Youtube,
  tiktok: Music2,
  website: Globe,
  email: Mail,
  whatsapp: MessageCircle,
  other: ExternalLink,
  custom: ExternalLink,
  header: Minus,
  pix: PixIcon,
  video_embed: Play,
  music_embed: Music2,
  file: FileDown,
  map: MapPin,
  phone: Phone,
};

/** Mapeamento Brand — logos oficiais das marcas (Simple Icons) */
const brandIcons: Record<string, IconComponent> = {
  instagram: SiInstagram,
  linkedin: FaLinkedin,
  github: SiGithub,
  twitter: SiX,
  youtube: SiYoutube,
  tiktok: SiTiktok,
  whatsapp: SiWhatsapp,
  website: Globe,
  email: Mail,
  other: ExternalLink,
  custom: ExternalLink,
  header: Minus,
  pix: PixIcon,
  video_embed: Play,
  music_embed: SiSpotify,
  file: FileDown,
  map: MapPin,
  phone: Phone,
};

/** Mapeamento Filled — icones solidos (Font Awesome 6) */
const filledIcons: Record<string, IconComponent> = {
  instagram: FaInstagram,
  linkedin: FaLinkedinIn,
  github: FaGithub,
  twitter: FaXTwitter,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  whatsapp: FaWhatsapp,
  website: FaGlobe,
  email: FaEnvelope,
  other: FaLink,
  custom: FaLink,
  header: FaMinus,
  pix: PixIcon,
  video_embed: FaPlay,
  music_embed: FaMusic,
  file: FaFileArrowDown,
  map: FaLocationDot,
  phone: FaPhone,
};

const packs: Record<string, Record<string, IconComponent>> = {
  lucide: lucideIcons,
  brand: brandIcons,
  filled: filledIcons,
};

/**
 * Retorna o componente de icone correto baseado no pacote e plataforma.
 * Fallback para lucide se o pacote nao tiver o icone.
 */
export function getIconForPlatform(platform: string, iconPack: string = 'lucide'): IconComponent {
  const pack = packs[iconPack] || packs.lucide;
  return pack[platform] || lucideIcons[platform] || ExternalLink;
}
