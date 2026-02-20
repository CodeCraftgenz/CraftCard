export const API_URL = import.meta.env.VITE_API_URL || '/api';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const APP_NAME = 'CraftCard';

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
] as const;

export const SOCIAL_PLATFORMS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle' },
  { value: 'instagram', label: 'Instagram', icon: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'Linkedin' },
  { value: 'github', label: 'GitHub', icon: 'Github' },
  { value: 'twitter', label: 'X (Twitter)', icon: 'Twitter' },
  { value: 'tiktok', label: 'TikTok', icon: 'Music2' },
  { value: 'youtube', label: 'YouTube', icon: 'Youtube' },
  { value: 'website', label: 'Site', icon: 'Globe' },
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'other', label: 'Outro', icon: 'Link' },
] as const;
