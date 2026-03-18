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
  { value: 'hexagons', label: 'Hexagonos' },
  { value: 'topography', label: 'Topografia' },
  { value: 'circuit', label: 'Circuito' },
  { value: 'confetti', label: 'Confete' },
  { value: 'stars', label: 'Estrelas' },
  { value: 'zigzag', label: 'Zigue-Zague' },
] as const;

// ── Mesh Gradient presets — fundos com radial-gradient sobrepostos estilo premium ──
export const MESH_GRADIENTS = [
  {
    value: 'mesh-rose',
    label: 'Rose',
    css: 'radial-gradient(circle at 15% 30%, rgba(255,182,193,0.55) 0%, transparent 45%), radial-gradient(circle at 85% 50%, rgba(196,181,253,0.55) 0%, transparent 50%), linear-gradient(135deg, #1a1025 0%, #2d1b3d 50%, #1a1025 100%)',
  },
  {
    value: 'mesh-ocean',
    label: 'Ocean',
    css: 'radial-gradient(circle at 20% 70%, rgba(0,228,242,0.45) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.5) 0%, transparent 45%), linear-gradient(160deg, #0a0e1a 0%, #0f172a 50%, #0a0e1a 100%)',
  },
  {
    value: 'mesh-sunset',
    label: 'Sunset',
    css: 'radial-gradient(circle at 25% 25%, rgba(255,107,107,0.5) 0%, transparent 45%), radial-gradient(circle at 75% 65%, rgba(255,217,61,0.4) 0%, transparent 50%), linear-gradient(145deg, #1a0a0a 0%, #2d1a0a 50%, #1a0a0a 100%)',
  },
  {
    value: 'mesh-aurora',
    label: 'Aurora',
    css: 'radial-gradient(circle at 30% 80%, rgba(0,184,148,0.5) 0%, transparent 50%), radial-gradient(circle at 70% 20%, rgba(162,155,254,0.5) 0%, transparent 45%), linear-gradient(150deg, #050d14 0%, #0a1628 50%, #050d14 100%)',
  },
  {
    value: 'mesh-berry',
    label: 'Berry',
    css: 'radial-gradient(circle at 10% 50%, rgba(232,67,147,0.5) 0%, transparent 45%), radial-gradient(circle at 90% 40%, rgba(108,92,231,0.5) 0%, transparent 50%), linear-gradient(135deg, #120a1e 0%, #1e0e2e 50%, #120a1e 100%)',
  },
  {
    value: 'mesh-ember',
    label: 'Ember',
    css: 'radial-gradient(circle at 20% 40%, rgba(255,107,107,0.45) 0%, transparent 50%), radial-gradient(circle at 80% 60%, rgba(232,67,147,0.4) 0%, transparent 45%), linear-gradient(140deg, #1a0a0e 0%, #2d0a14 50%, #1a0a0e 100%)',
  },
  {
    value: 'mesh-arctic',
    label: 'Arctic',
    css: 'radial-gradient(circle at 15% 60%, rgba(99,102,241,0.45) 0%, transparent 50%), radial-gradient(circle at 85% 30%, rgba(0,228,242,0.4) 0%, transparent 45%), radial-gradient(circle at 50% 90%, rgba(196,181,253,0.3) 0%, transparent 40%), linear-gradient(155deg, #080c18 0%, #0e1425 50%, #080c18 100%)',
  },
  {
    value: 'mesh-gold',
    label: 'Gold',
    css: 'radial-gradient(circle at 25% 35%, rgba(255,217,61,0.45) 0%, transparent 45%), radial-gradient(circle at 75% 65%, rgba(255,159,67,0.4) 0%, transparent 50%), linear-gradient(140deg, #1a1400 0%, #2d2200 50%, #1a1400 100%)',
  },
] as const;

// ── Animated background presets ──
export const ANIMATED_BACKGROUNDS = [
  { value: 'aurora', label: 'Aurora' },
  { value: 'mesh-gradient', label: 'Mesh' },
  { value: 'particles', label: 'Particulas' },
  { value: 'waves-animated', label: 'Ondas' },
  { value: 'gradient-flow', label: 'Fluxo' },
  { value: 'starfield', label: 'Estrelas' },
] as const;

export const LINK_LAYOUTS = [
  { value: 'list', label: 'Lista' },
  { value: 'grid', label: 'Grid' },
] as const;

export const LINK_STYLES = [
  { value: 'rounded', label: 'Arredondado' },
  { value: 'pill', label: 'Pilula' },
  { value: 'square', label: 'Quadrado' },
  { value: 'outline', label: 'Contorno' },
  { value: 'ghost', label: 'Transparente' },
  { value: 'elevated', label: 'Elevado' },
  { value: 'glassmorphism', label: 'Glassmorphism' },
  { value: 'neon-border', label: 'Neon Border' },
] as const;

export const ICON_STYLES = [
  { value: 'default', label: 'Original' },
  { value: 'filled', label: 'Preenchido' },
  { value: 'outline', label: 'Contorno' },
  { value: 'neomorph', label: 'Neomorph' },
  { value: 'glass', label: 'Glass' },
  { value: 'gradient', label: 'Gradiente' },
  { value: 'neon', label: 'Neon' },
  { value: 'shadow', label: 'Sombra' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'circle', label: 'Circulo' },
  { value: 'soft', label: 'Soft' },
  // Novos estilos de icone
  { value: 'duotone', label: 'Duotone' },
  { value: 'isometric', label: '3D' },
  { value: 'badge', label: 'Badge' },
  { value: 'floating', label: 'Flutuante' },
  { value: 'diamond', label: 'Diamante' },
] as const;

export const LINK_ANIMATIONS = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'scale', label: 'Escala' },
  { value: 'slide', label: 'Deslizar' },
  { value: 'glow', label: 'Brilho' },
  // Novas animações de hover para links
  { value: 'bounce', label: 'Saltar' },
  { value: 'tilt3d', label: '3D' },
  { value: 'flip', label: 'Virar' },
  { value: 'pulse', label: 'Pulsar' },
] as const;

// ── Per-link button shape (border-radius / clip-path) ──
export const BLOCK_SHAPES = [
  { value: 'default', label: 'Padrão', desc: 'Usa estilo global' },
  { value: 'rounded', label: 'Arredondado', desc: 'rounded-2xl' },
  { value: 'pill', label: 'Pilula', desc: 'Totalmente arredondado' },
  { value: 'square', label: 'Quadrado', desc: 'Cantos retos' },
  { value: 'ticket', label: 'Ticket', desc: 'Recorte lateral' },
  { value: 'leaf', label: 'Folha', desc: 'Cantos assimetricos' },
  { value: 'brutalist', label: 'Brutalist', desc: 'Borda grossa angular' },
] as const;

// ── Per-link button texture / visual effect ──
export const BLOCK_TEXTURES = [
  { value: 'none', label: 'Nenhuma', desc: 'Sem textura' },
  { value: 'glass', label: 'Vidro', desc: 'Glassmorphism sutil' },
  { value: 'noise', label: 'Ruido', desc: 'Granulado sutil' },
  { value: 'gradient-shine', label: 'Brilho', desc: 'Reflexo deslizante' },
  { value: 'brushed', label: 'Escovado', desc: 'Metal escovado' },
  { value: 'frosted', label: 'Fosco', desc: 'Vidro fosco' },
  { value: 'holographic', label: 'Holografico', desc: 'Efeito holografico' },
] as const;

// ── Per-link button skins (premium PNG backgrounds) ──
export const BUTTON_SKINS = [
  { value: 'none', label: 'Nenhuma', desc: 'Sem skin' },
  { value: 'watercolor', label: 'Aquarela', desc: 'Fundo pintado a mao' },
  { value: 'neon-glow', label: 'Neon', desc: 'Brilho neon intenso' },
  { value: 'wood', label: 'Madeira', desc: 'Textura de madeira' },
  { value: 'marble', label: 'Marmore', desc: 'Pedra marmore polida' },
  { value: 'paper', label: 'Papel', desc: 'Papel envelhecido' },
  { value: 'metal', label: 'Metal', desc: 'Metal escovado premium' },
  { value: 'gradient-mesh', label: 'Mesh', desc: 'Gradiente mesh colorido' },
] as const;

export type BlockShapeValue = typeof BLOCK_SHAPES[number]['value'];
export type BlockTextureValue = typeof BLOCK_TEXTURES[number]['value'];
export type ButtonSkinValue = typeof BUTTON_SKINS[number]['value'];

export const GRID_SIZES = [
  { value: '1x1', label: 'Pequeno', desc: '400×400', cols: 1, rows: 1, w: 14, h: 14 },
  { value: '2x1', label: 'Wide', desc: '800×400', cols: 2, rows: 1, w: 28, h: 14 },
  { value: '3x1', label: 'Banner', desc: '1200×400', cols: 3, rows: 1, w: 42, h: 14 },
  { value: '1x2', label: 'Alto', desc: '400×800', cols: 1, rows: 2, w: 14, h: 28 },
  { value: '2x2', label: 'Grande', desc: '800×800', cols: 2, rows: 2, w: 28, h: 28 },
] as const;

export type GridSizeValue = typeof GRID_SIZES[number]['value'];

export function parseMetadata(str: string | null | undefined): Record<string, string> {
  if (!str) return {};
  try { return JSON.parse(str); } catch { return {}; }
}

export function setMetadataField(current: string | null | undefined, key: string, value: string): string {
  const meta = parseMetadata(current);
  meta[key] = value;
  return JSON.stringify(meta);
}

export function getGridSize(metadata: string | null | undefined): typeof GRID_SIZES[number] {
  const meta = parseMetadata(metadata);
  const val = meta.gridSize || '1x1';
  return GRID_SIZES.find(s => s.value === val) || GRID_SIZES[0];
}

export const SOCIAL_PLATFORMS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle', urlPrefix: 'https://wa.me/', placeholder: 'https://wa.me/5511999999999' },
  { value: 'instagram', label: 'Instagram', icon: 'Instagram', urlPrefix: 'https://instagram.com/', placeholder: 'https://instagram.com/seu_usuário' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'Linkedin', urlPrefix: 'https://linkedin.com/in/', placeholder: 'https://linkedin.com/in/seu-perfil' },
  { value: 'github', label: 'GitHub', icon: 'Github', urlPrefix: 'https://github.com/', placeholder: 'https://github.com/seu_usuário' },
  { value: 'twitter', label: 'X (Twitter)', icon: 'Twitter', urlPrefix: 'https://x.com/', placeholder: 'https://x.com/seu_usuário' },
  { value: 'tiktok', label: 'TikTok', icon: 'Music2', urlPrefix: 'https://tiktok.com/@', placeholder: 'https://tiktok.com/@seu_usuário' },
  { value: 'youtube', label: 'YouTube', icon: 'Youtube', urlPrefix: 'https://youtube.com/@', placeholder: 'https://youtube.com/@seu_canal' },
  { value: 'website', label: 'Site', icon: 'Globe', urlPrefix: 'https://', placeholder: 'https://seu-site.com' },
  { value: 'email', label: 'Email', icon: 'Mail', urlPrefix: 'mailto:', placeholder: 'mailto:seu@email.com' },
  { value: 'other', label: 'Outro', icon: 'Link', urlPrefix: 'https://', placeholder: 'https://...' },
  { value: 'custom', label: 'Link Personalizado', icon: 'ExternalLink', urlPrefix: 'https://', placeholder: 'https://...' },
  { value: 'header', label: 'Separador', icon: 'Minus', urlPrefix: '', placeholder: 'Título da secao' },
  { value: 'phone', label: 'Telefone', icon: 'Phone', urlPrefix: 'tel:', placeholder: 'tel:+5511999999999' },
  { value: 'pix', label: 'Pix', icon: 'QrCode', urlPrefix: '', placeholder: 'Chave Pix' },
  { value: 'video_embed', label: 'Video (YouTube)', icon: 'Play', urlPrefix: 'https://', placeholder: 'https://youtube.com/watch?v=...' },
  { value: 'music_embed', label: 'Música (Spotify)', icon: 'Music2', urlPrefix: 'https://', placeholder: 'https://open.spotify.com/track/...' },
  { value: 'file', label: 'Arquivo', icon: 'FileDown', urlPrefix: 'https://', placeholder: 'https://link-do-arquivo.pdf' },
  { value: 'map', label: 'Mapa', icon: 'MapPin', urlPrefix: '', placeholder: 'Av. Paulista, 1000 - Sao Paulo, SP' },
] as const;
