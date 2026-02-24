export const API_URL = import.meta.env.VITE_API_URL || '/api';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const API_BASE = API_URL.replace(/\/api$/, '');
export const APP_NAME = 'CraftCard';

/** Resolve a photo URL: absolute URLs pass through, relative API paths get the backend origin prepended */
export function resolvePhotoUrl(photoUrl: string | null | undefined): string | undefined {
  if (!photoUrl) return undefined;
  if (photoUrl.startsWith('http') || photoUrl.startsWith('data:')) return photoUrl;
  return API_BASE + photoUrl;
}

export const BRAND_COLORS = {
  cyan: '#00E4F2',
  magenta: '#D12BF2',
  purple: '#68007B',
  bgDark: '#1A1A2E',
  bgCard: '#16213E',
} as const;

export const PRESET_BUTTON_COLORS = [
  '#00E4F2',
  '#D12BF2',
  '#68007B',
  '#FF6B6B',
  '#4ECDC4',
  '#FFD93D',
  '#6C5CE7',
  '#00B894',
  '#E84393',
  '#0984E3',
  '#FD79A8',
  '#55EFC4',
  '#A29BFE',
  '#FAB1A0',
  '#81ECEC',
  '#DFE6E9',
] as const;

export const PRESET_GRADIENTS = [
  { label: 'Cyber', value: '135deg,#00E4F2,#D12BF2' },
  { label: 'Sunset', value: '135deg,#FF6B6B,#FFD93D' },
  { label: 'Ocean', value: '135deg,#0984E3,#00B894' },
  { label: 'Grape', value: '135deg,#6C5CE7,#E84393' },
  { label: 'Forest', value: '135deg,#00B894,#55EFC4' },
  { label: 'Fire', value: '135deg,#FF6B6B,#E84393' },
  { label: 'Night', value: '135deg,#2C3E50,#4CA1AF' },
  { label: 'Aurora', value: '135deg,#A29BFE,#00E4F2' },
] as const;

export const PRESET_PATTERNS = [
  { value: 'dots', label: 'Pontos' },
  { value: 'grid', label: 'Grade' },
  { value: 'waves', label: 'Ondas' },
  { value: 'circles', label: 'Circulos' },
  { value: 'diagonal', label: 'Diagonal' },
  { value: 'cross', label: 'Cruz' },
] as const;

export const LINK_STYLES = [
  { value: 'rounded', label: 'Arredondado' },
  { value: 'pill', label: 'Pilula' },
  { value: 'square', label: 'Quadrado' },
  { value: 'outline', label: 'Contorno' },
  { value: 'ghost', label: 'Transparente' },
] as const;

export const LINK_ANIMATIONS = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'scale', label: 'Escala' },
  { value: 'slide', label: 'Deslizar' },
  { value: 'glow', label: 'Brilho' },
] as const;

export const SOCIAL_PLATFORMS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle', urlPrefix: 'https://wa.me/', placeholder: 'https://wa.me/5511999999999' },
  { value: 'instagram', label: 'Instagram', icon: 'Instagram', urlPrefix: 'https://instagram.com/', placeholder: 'https://instagram.com/seu_usuario' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'Linkedin', urlPrefix: 'https://linkedin.com/in/', placeholder: 'https://linkedin.com/in/seu-perfil' },
  { value: 'github', label: 'GitHub', icon: 'Github', urlPrefix: 'https://github.com/', placeholder: 'https://github.com/seu_usuario' },
  { value: 'twitter', label: 'X (Twitter)', icon: 'Twitter', urlPrefix: 'https://x.com/', placeholder: 'https://x.com/seu_usuario' },
  { value: 'tiktok', label: 'TikTok', icon: 'Music2', urlPrefix: 'https://tiktok.com/@', placeholder: 'https://tiktok.com/@seu_usuario' },
  { value: 'youtube', label: 'YouTube', icon: 'Youtube', urlPrefix: 'https://youtube.com/@', placeholder: 'https://youtube.com/@seu_canal' },
  { value: 'website', label: 'Site', icon: 'Globe', urlPrefix: 'https://', placeholder: 'https://seu-site.com' },
  { value: 'email', label: 'Email', icon: 'Mail', urlPrefix: 'mailto:', placeholder: 'mailto:seu@email.com' },
  { value: 'other', label: 'Outro', icon: 'Link', urlPrefix: 'https://', placeholder: 'https://...' },
  { value: 'custom', label: 'Link Personalizado', icon: 'ExternalLink', urlPrefix: 'https://', placeholder: 'https://...' },
  { value: 'header', label: 'Separador', icon: 'Minus', urlPrefix: '', placeholder: 'Titulo da secao' },
  { value: 'phone', label: 'Telefone', icon: 'Phone', urlPrefix: 'tel:', placeholder: 'tel:+5511999999999' },
  { value: 'pix', label: 'Pix', icon: 'QrCode', urlPrefix: '', placeholder: 'Chave Pix' },
  { value: 'video_embed', label: 'Video (YouTube)', icon: 'Play', urlPrefix: 'https://', placeholder: 'https://youtube.com/watch?v=...' },
  { value: 'music_embed', label: 'Musica (Spotify)', icon: 'Music2', urlPrefix: 'https://', placeholder: 'https://open.spotify.com/track/...' },
  { value: 'file', label: 'Arquivo', icon: 'FileDown', urlPrefix: 'https://', placeholder: 'https://link-do-arquivo.pdf' },
  { value: 'map', label: 'Mapa', icon: 'MapPin', urlPrefix: 'https://', placeholder: 'https://maps.google.com/...' },
] as const;
