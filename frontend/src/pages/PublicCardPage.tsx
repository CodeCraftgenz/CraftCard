/**
 * PublicCardPage.tsx — Pagina publica do cartao digital.
 *
 * Esta e a pagina mais importante do produto: e o que visitantes veem ao escanear
 * um QR Code ou acessar craftcardgenz.com/:slug.
 *
 * Funcionalidades:
 * - Renderizacao do perfil completo (foto, bio, links, galeria, servicos, FAQ, depoimentos)
 * - Temas visuais dinamicos (10 temas) com fundos customizaveis (gradiente, imagem, padrao, animado)
 * - Branding corporativo da organizacao sobrepoe configuracoes individuais
 * - Lead gate: formulario obrigatorio de nome/email antes de ver o cartao (quando ativado)
 * - Formulario de contato e depoimentos
 * - Agendamento de reunioes (BookingCalendar)
 * - Compartilhamento (Web Share API + modal fallback com WhatsApp, Telegram, Email, QR Code)
 * - Download do cartao como imagem PNG (gerada via Canvas API)
 * - Download de vCard (.vcf) para salvar contato no celular
 * - Modo apresentacao (QR Code em tela cheia para eventos)
 * - SEO completo (Helmet: OG tags, Twitter Cards, JSON-LD Schema.org)
 * - Tracking de visualizacao (exclui o proprio dono do cartao)
 * - Conexoes entre usuarios (rede social interna)
 * - Suporte a modo hackathon (?mode=hackathon)
 */

import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Mail,
  MessageCircle,
  Share2,
  FileText,
  User,
  Download,
  X,
  Send,
  Copy,
  Check,
  MessageSquare,
  Star,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  ImageIcon,
  CalendarDays,
  Briefcase,
  HelpCircle,
  UserPlus,
  Scan,
  Instagram,
} from 'lucide-react';
import { CustomQrCode } from '@/components/organisms/CustomQrCode';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground';
import { AnimatedBackgroundOverlay } from '@/components/organisms/AnimatedBackgroundOverlay';
import { GalleryGrid } from '@/components/organisms/GalleryGrid';
import { LocationMap } from '@/components/organisms/LocationMap';
import { LinkRenderer, GridLinkRenderer } from '@/components/organisms/LinkRenderer';
import { BookingCalendar } from '@/components/organisms/BookingCalendar';
import { ConnectButton } from '@/components/organisms/ConnectButton';
import { ConnectionsSection } from '@/components/organisms/ConnectionsSection';
import { api } from '@/lib/api';
import { trackViewEvent } from '@/hooks/useAnalytics';
import { usePublicSlots } from '@/hooks/useBookings';
import { useSendMessage } from '@/hooks/useContacts';
import { useSubmitTestimonial } from '@/hooks/useTestimonials';
import { useAuth } from '@/providers/AuthProvider';
import { API_BASE, APP_NAME, MESH_GRADIENTS, resolvePhotoUrl } from '@/lib/constants';
import { loadGoogleFont } from '@/lib/google-fonts';

const HackathonPublicCard = lazy(() => import('@/hackathon/HackathonPublicCard'));

/** Dados do perfil retornados pela API publica (GET /profile/:slug) */
interface PublicProfile {
  id: string;
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
  resumeUrl: string | null;
  buttonColor: string;
  cardTheme: string;
  coverPhotoUrl: string | null;
  photoPositionY: number;
  coverPositionY: number;
  availabilityStatus: string | null;
  availabilityMessage: string | null;
  viewCount: number;
  isVerified?: boolean;
  plan?: string;
  videoUrl?: string | null;
  fontFamily?: string | null;
  fontSizeScale?: number | null;
  backgroundType?: string | null;
  backgroundGradient?: string | null;
  backgroundImageUrl?: string | null;
  backgroundOverlay?: number | null;
  backgroundPattern?: string | null;
  linkLayout?: string | null;
  linkStyle?: string | null;
  linkAnimation?: string | null;
  iconStyle?: string | null;
  connectionsEnabled?: boolean;
  connections?: Array<{ id: string; displayName: string; photoUrl: string | null; slug: string; tagline: string | null }>;
  leadCaptureEnabled?: boolean;
  bookingEnabled?: boolean;
  contactFormEnabled?: boolean;
  testimonialsEnabled?: boolean;
  socialLinks: Array<{
    id: string;
    platform: string;
    label: string;
    url: string;
    order: number;
    linkType?: string | null;
    metadata?: string | null;
  }>;
  testimonials?: Array<{
    id: string;
    authorName: string;
    authorRole: string | null;
    text: string;
    createdAt: string;
  }>;
  galleryImages?: Array<{
    id: string;
    imageUrl?: string | null;
    imageData?: string | null;
    caption: string | null;
    order: number;
  }>;
  services?: Array<{
    id: string;
    title: string;
    description: string | null;
    price: string | null;
    order: number;
  }>;
  faqItems?: Array<{
    id: string;
    question: string;
    answer: string;
    order: number;
  }>;
  location?: string | null;
  pronouns?: string | null;
  workingHours?: string | null;
  tagline?: string | null;
  sectionsOrder?: string | null;
  user?: {
    name: string;
    email: string;
  };
  orgBranding?: {
    orgName: string;
    orgLogoUrl: string | null;
    orgPrimaryColor: string;
    orgSecondaryColor: string;
    orgFontFamily: string;
  } | null;
}

/** Retorna o CSS background baseado no tema selecionado e na cor de destaque do usuario */
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
    // Novos temas — backgrounds de pagina inteira
    case 'glass':       // Vidro: transparencia sutil sobre fundo escuro
      return 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, #0f172a 50%, rgba(255,255,255,0.03) 100%)';
    case 'brutalist':   // Brutalista: fundo solido escuro sem gradiente
      return '#111111';
    case 'neumorphism': // Neumorfismo: gradiente sutil entre tons de azul-escuro
      return 'linear-gradient(145deg, #1e2030 0%, #171926 100%)';
    case 'terminal':    // Terminal: fundo quase preto para contrastar com texto verde
      return '#0a0a0a';
    case 'polaroid':    // Polaroid: toque suave de roxo no topo, transicao para escuro
      return 'linear-gradient(180deg, #2d1f3d20 0%, #1A1A2E 30%, #1A1A2E 100%)';
    case 'pastel':      // Pastel: rosa e lilas delicados com fundo escuro
      return 'linear-gradient(135deg, #FFB6C120 0%, #C4B5FD15 50%, #1A1A2E 100%)';
    case 'noir':        // Noir: preto puro para drama cinematografico
      return '#000000';
    case 'retro':       // Retro: pink e ciano neon sobre fundo muito escuro
      return 'linear-gradient(135deg, #EC489920 0%, #00E4F215 50%, #0A0A1A 100%)';
    default:
      return `linear-gradient(180deg, ${accent}15 0%, #1A1A2E 30%, #1A1A2E 100%)`;
  }
}

/** Retorna classes Tailwind do container do cartao baseado no tema (glassmorphism, bordas, etc) */
function getThemeCardStyle(theme: string): string {
  switch (theme) {
    case 'gradient':
      return 'backdrop-blur-xl bg-white/[0.08] border border-white/10 rounded-3xl shadow-2xl';
    case 'minimal':
      return 'bg-transparent';
    case 'bold':
      return 'backdrop-blur-xl bg-white/5 border-2 border-white/20 rounded-3xl shadow-2xl';
    case 'ocean':
      return 'backdrop-blur-xl bg-white/5 border border-teal-500/20 rounded-3xl shadow-2xl';
    case 'sunset':
      return 'backdrop-blur-xl bg-white/5 border border-orange-500/20 rounded-3xl shadow-2xl';
    case 'forest':
      return 'backdrop-blur-xl bg-white/5 border border-green-500/20 rounded-3xl shadow-2xl';
    case 'neon':
      return 'backdrop-blur-xl bg-black/50 border border-pink-500/40 rounded-3xl shadow-[0_0_30px_rgba(236,72,153,0.15)]';
    case 'elegant':
      return 'backdrop-blur-xl bg-white/[0.06] border border-yellow-600/20 rounded-3xl shadow-2xl';
    case 'cosmic':
      return 'backdrop-blur-xl bg-white/5 border border-purple-500/20 rounded-3xl shadow-2xl';
    // Novos temas — estilos do container (card) interno
    case 'glass':       // Glassmorphism: blur forte + borda branca translucida
      return 'bg-white/[0.12] backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl';
    case 'brutalist':   // Brutalista: sem arredondamento, borda grossa, sombra solida deslocada
      return 'bg-[#111] border-4 border-white rounded-none shadow-[8px_8px_0px_rgba(255,255,255,0.3)]';
    case 'neumorphism': // Neumorfismo: sombras internas e externas simulando relevo 3D
      return 'bg-[#1e2030] rounded-3xl shadow-[8px_8px_16px_#0d0f18,-8px_-8px_16px_#2f3348] border border-white/5';
    case 'terminal':    // Terminal: borda verde sutil com glow, cantos menos arredondados
      return 'bg-[#0d1117] border border-green-500/30 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.1)]';
    case 'polaroid':    // Polaroid: borda larga branca imitando foto instantanea
      return 'bg-white/[0.08] border-4 border-white/30 rounded-xl shadow-2xl';
    case 'pastel':      // Pastel: borda rosa suave, cantos bem arredondados
      return 'bg-white/[0.08] border border-pink-300/20 rounded-[2rem] shadow-xl';
    case 'noir':        // Noir: fundo preto com borda dourada elegante
      return 'bg-black/80 border border-yellow-600/30 rounded-2xl shadow-2xl';
    case 'retro':       // Retro: borda pink neon com glow sutil
      return 'bg-white/5 border-2 border-pink-500/30 rounded-2xl shadow-[0_0_30px_rgba(236,72,153,0.1)]';
    default:
      return 'backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl';
  }
}

/** Renderiza padrao SVG como overlay de fundo (dots, grid, waves, hexagons, etc) */
function PatternOverlay({ pattern, color }: { pattern: string; color: string }) {
  const c = `${color}30`;
  switch (pattern) {
    case 'dots':
      return (
        <svg width="100%" height="100%">
          <pattern id="bg-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.5" fill={c} />
          </pattern>
          <rect width="100%" height="100%" fill="url(#bg-dots)" />
        </svg>
      );
    case 'grid':
      return (
        <svg width="100%" height="100%">
          <pattern id="bg-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={c} strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#bg-grid)" />
        </svg>
      );
    case 'waves':
      return (
        <svg width="100%" height="100%">
          <pattern id="bg-waves" width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M0 10 Q10 0 20 10 T40 10" fill="none" stroke={c} strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#bg-waves)" />
        </svg>
      );
    case 'circles':
      return (
        <svg width="100%" height="100%">
          <pattern id="bg-circles" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="15" cy="15" r="8" fill="none" stroke={c} strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#bg-circles)" />
        </svg>
      );
    case 'diagonal':
      return (
        <svg width="100%" height="100%">
          <pattern id="bg-diag" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M0 12 L12 0" stroke={c} strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#bg-diag)" />
        </svg>
      );
    case 'cross':
      return (
        <svg width="100%" height="100%">
          <pattern id="bg-cross" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M8 0 V16 M0 8 H16" stroke={c} strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#bg-cross)" />
        </svg>
      );
    case 'hexagons':
      return (
        <svg width="100%" height="100%">
          <pattern id="bg-hex" width="34" height="40" patternUnits="userSpaceOnUse">
            <path d="M17 0 L34 10 L34 30 L17 40 L0 30 L0 10 Z" fill="none" stroke={c} strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#bg-hex)" />
        </svg>
      );
    case 'topography':
      return (
        <svg width="100%" height="100%">
          <pattern id="bg-topo" width="80" height="60" patternUnits="userSpaceOnUse">
            <path d="M10 20 Q30 10 50 24 Q70 38 80 20" fill="none" stroke={c} strokeWidth="0.5" />
            <path d="M0 40 Q20 30 40 44 Q60 56 80 38" fill="none" stroke={c} strokeWidth="0.5" />
            <path d="M10 55 Q30 48 50 58 Q70 65 80 52" fill="none" stroke={c} strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#bg-topo)" />
        </svg>
      );
    case 'circuit':
      return (
        <svg width="100%" height="100%">
          <pattern id="bg-circuit" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M10 10 H30 V25 H50 M15 40 H35 V55 M25 15 V45" fill="none" stroke={c} strokeWidth="0.5" />
            <circle cx="10" cy="10" r="2" fill={c} />
            <circle cx="50" cy="25" r="2" fill={c} />
            <circle cx="35" cy="55" r="2" fill={c} />
          </pattern>
          <rect width="100%" height="100%" fill="url(#bg-circuit)" />
        </svg>
      );
    case 'confetti':
      return (
        <svg width="100%" height="100%">
          <pattern id="bg-confetti" width="50" height="50" patternUnits="userSpaceOnUse">
            <rect x="8" y="12" width="4" height="8" rx="1" fill={c} transform="rotate(30 10 16)" />
            <rect x="30" y="8" width="4" height="8" rx="1" fill={c} transform="rotate(-20 32 12)" />
            <rect x="18" y="35" width="4" height="8" rx="1" fill={c} transform="rotate(45 20 39)" />
            <rect x="42" y="30" width="4" height="8" rx="1" fill={c} transform="rotate(-15 44 34)" />
            <circle cx="40" cy="12" r="3" fill={c} />
            <circle cx="12" cy="42" r="3" fill={c} />
          </pattern>
          <rect width="100%" height="100%" fill="url(#bg-confetti)" />
        </svg>
      );
    case 'stars':
      return (
        <svg width="100%" height="100%">
          <pattern id="bg-stars" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 5 L22 15 L30 15 L24 20 L26 30 L20 24 L14 30 L16 20 L10 15 L18 15 Z" fill={c} />
          </pattern>
          <rect width="100%" height="100%" fill="url(#bg-stars)" />
        </svg>
      );
    case 'zigzag':
      return (
        <svg width="100%" height="100%">
          <pattern id="bg-zigzag" width="24" height="12" patternUnits="userSpaceOnUse">
            <path d="M0 6 L6 0 L12 6 L18 0 L24 6" fill="none" stroke={c} strokeWidth="0.8" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#bg-zigzag)" />
        </svg>
      );
    default:
      return null;
  }
}

/** Componente accordion para exibicao de FAQ no cartao publico */
function FaqAccordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/10 transition-all hover:bg-white/[0.07]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-white">{question}</span>
        <ChevronDown size={14} className={`text-white/30 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <p className="text-xs text-white/50 mt-2 leading-relaxed">{answer}</p>
      )}
    </button>
  );
}

/** Escapa caracteres especiais para formato vCard (RFC 6350) */
function escapeVCard(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/**
 * Gera arquivo vCard (.vcf) a partir dos dados do perfil.
 * Inclui: nome, cargo, bio, foto, email, telefone, WhatsApp, redes sociais.
 * Permite que visitantes salvem o contato diretamente na agenda do celular.
 */
function generateVCard(profile: PublicProfile): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCard(profile.displayName)}`,
  ];

  if (profile.tagline) {
    lines.push(`TITLE:${escapeVCard(profile.tagline)}`);
  }

  if (profile.bio) {
    lines.push(`NOTE:${escapeVCard(profile.bio)}`);
  }

  if (profile.location) {
    lines.push(`ADR;TYPE=WORK:;;${escapeVCard(profile.location)};;;;`);
  }

  if (profile.photoUrl) {
    lines.push(`PHOTO;TYPE=URL:${resolvePhotoUrl(profile.photoUrl)}`);
  }

  const emailLink = profile.socialLinks.find((l) => l.platform === 'email');
  if (emailLink) {
    const email = emailLink.url.replace('mailto:', '');
    lines.push(`EMAIL:${email}`);
  }

  const phoneLink = profile.socialLinks.find((l) => l.platform === 'phone');
  if (phoneLink) {
    const phone = phoneLink.url.replace(/^tel:/, '').replace(/\D/g, '');
    if (phone) lines.push(`TEL;TYPE=VOICE:+${phone}`);
  }

  const whatsappLink = profile.socialLinks.find((l) => l.platform === 'whatsapp');
  if (whatsappLink) {
    const phone = whatsappLink.url.replace(/.*wa\.me\//, '').replace(/\D/g, '');
    if (phone) lines.push(`TEL;TYPE=CELL:+${phone}`);
  }

  const websiteLink = profile.socialLinks.find((l) => l.platform === 'website');
  if (websiteLink) {
    lines.push(`URL:${websiteLink.url}`);
  }

  // Social profiles
  const socialPlatforms = ['instagram', 'linkedin', 'github', 'twitter', 'youtube', 'tiktok'] as const;
  for (const platform of socialPlatforms) {
    const link = profile.socialLinks.find((l) => l.platform === platform);
    if (link) lines.push(`X-SOCIALPROFILE;TYPE=${platform}:${link.url}`);
  }

  lines.push(`URL:${window.location.href}`);
  lines.push('END:VCARD');

  return lines.join('\r\n');
}

// ── Helpers para exportacao de imagem via Canvas API ─────────────────────────
// Geram um PNG 1050x600 com foto, nome, tagline, bio, QR code e branding.
// Usado no botao "Baixar Cartao" e "Exportar como Imagem".

/** Carrega uma imagem de forma assincrona com suporte a CORS */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Desenha retangulo com cantos arredondados no Canvas (usado para fundo do QR Code) */
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─────────────────────────────────────────────────────────────────────────────

/** Gera e faz download do arquivo vCard (.vcf) do perfil */
function handleDownloadVCard(profile: PublicProfile) {
  const vcf = generateVCard(profile);
  const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${profile.displayName.replace(/\s+/g, '-').toLowerCase()}.vcf`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Pagina publica do cartao digital — rota /:slug */
export function PublicCardPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { cards, isAuthenticated, isLoading: authLoading } = useAuth();

  // Modo hackathon: renderiza versao especial do cartao para eventos
  if (searchParams.get('mode') === 'hackathon') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#001a33] flex items-center justify-center"><div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>}>
        <HackathonPublicCard />
      </Suspense>
    );
  }
  const [showContactForm, setShowContactForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [contactForm, setContactForm] = useState({ senderName: '', senderEmail: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  // Estado para exibir dica do Instagram apos salvar imagem
  const [instagramHint, setInstagramHint] = useState(false);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({ authorName: '', authorRole: '', text: '' });
  const [testimonialSuccess, setTestimonialSuccess] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showAllLinks, setShowAllLinks] = useState(false);
  // Lead gate: verifica no localStorage se o visitante ja preencheu o formulario
  // para este cartao. Persistido por slug para nao pedir novamente.
  const [leadGatePassed, setLeadGatePassed] = useState(() => {
    if (!slug) return false;
    return localStorage.getItem(`lead-${slug}`) === 'true';
  });
  const [leadForm, setLeadForm] = useState({ name: '', email: '' });
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const qrExportRef = useRef<HTMLDivElement>(null);
  const [showPresentationMode, setShowPresentationMode] = useState(false);
  const sendMessage = useSendMessage();
  const submitTestimonial = useSubmitTestimonial();
  const { data: publicSlots } = usePublicSlots(slug);

  // Verifica se o visitante e o dono do cartao para pular tracking de view
  // (evita inflar metricas quando o dono acessa o proprio cartao)
  const isOwner = cards?.some((c) => c.slug === slug) ?? false;

  const { data: profile, isLoading, error } = useQuery<PublicProfile>({
    queryKey: ['public-profile', slug],
    queryFn: () => api.get(`/profile/${slug}`),
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  // Deriva configuracoes visuais com fallbacks seguros (funciona mesmo com profile=null).
  // Branding da organizacao tem prioridade sobre configuracoes individuais.
  const orgB = profile?.orgBranding;
  const accent = orgB?.orgPrimaryColor || profile?.buttonColor || '#00E4F2';
  const theme = profile?.cardTheme || 'default';
  const fontFamily = orgB?.orgFontFamily || profile?.fontFamily || 'Inter';
  const fontScale = profile?.fontSizeScale ?? 1;
  const bgType = profile?.backgroundType || 'theme';
  const linkLayout = profile?.linkLayout || 'list';
  const linkStyle = profile?.linkStyle || 'rounded';
  const linkAnim = profile?.linkAnimation || 'none';
  const iconStyle = profile?.iconStyle || 'default';

  // Carrega fonte Google customizada (deve estar antes de returns condicionais — regras de hooks)
  useEffect(() => { if (profile) loadGoogleFont(fontFamily); }, [fontFamily, profile]);

  // Tracking de visualizacao: aguarda auth resolver para saber se e o dono, e entao registra
  useEffect(() => { if (profile?.id && !authLoading && !isOwner) trackViewEvent(profile.id); }, [profile?.id, authLoading, isOwner]);

  const handleSendMessage = async () => {
    if (!slug) return;
    try {
      await sendMessage.mutateAsync({
        slug,
        data: {
          senderName: contactForm.senderName,
          senderEmail: contactForm.senderEmail || undefined,
          message: contactForm.message,
        },
      });
      setContactSuccess(true);
      setContactForm({ senderName: '', senderEmail: '', message: '' });
      setTimeout(() => {
        setContactSuccess(false);
        setShowContactForm(false);
      }, 3000);
    } catch {
      // Error handled by mutation state
    }
  };

  const handleSubmitTestimonial = async () => {
    if (!slug) return;
    try {
      await submitTestimonial.mutateAsync({
        slug,
        data: {
          authorName: testimonialForm.authorName,
          authorRole: testimonialForm.authorRole || undefined,
          text: testimonialForm.text,
        },
      });
      setTestimonialSuccess(true);
      setTestimonialForm({ authorName: '', authorRole: '', text: '' });
      setTimeout(() => {
        setTestimonialSuccess(false);
        setShowTestimonialForm(false);
      }, 3000);
    } catch {
      // Error handled by mutation state
    }
  };

  // Submissao do lead gate: envia dados como mensagem e salva no localStorage
  // para nao pedir novamente. Continua mesmo se a API falhar (melhor UX).
  const handleLeadSubmit = async () => {
    if (!slug || leadForm.name.length < 2 || !leadForm.email.includes('@')) return;
    setLeadSubmitting(true);
    try {
      await sendMessage.mutateAsync({
        slug,
        data: {
          senderName: leadForm.name,
          senderEmail: leadForm.email,
          message: `[Lead] ${leadForm.name} (${leadForm.email})`,
        },
      });
    } catch {
      // continue even if API fails
    }
    localStorage.setItem(`lead-${slug}`, 'true');
    setLeadGatePassed(true);
    setLeadSubmitting(false);
  };

  const pageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${slug}`
    : '';
  const displayName = profile?.displayName || '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pageUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  /**
   * Exporta o cartao como imagem PNG via Canvas API.
   * Gera um canvas 1050x600 (proporcoes de cartao de visita) com:
   * - Fundo gradiente escuro + barra de destaque colorida
   * - Foto de perfil circular + nome, tagline, bio, localizacao
   * - QR Code com fundo branco para leitura confiavel
   * - Branding "CraftCard" no canto inferior direito
   */
  const handleExportImage = async () => {
    if (!profile || !slug) return;
    setExporting(true);
    try {
      // Captura o canvas do QR Code renderizado off-screen
      const qrCanvas = qrExportRef.current?.querySelector('canvas');

      // Dimensoes do cartao: 1050x600 (proporcoes de cartao de visita, ideal para compartilhar)
      const W = 1050, H = 600;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Background
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#0A0E1A');
      grad.addColorStop(0.6, '#1A1A2E');
      grad.addColorStop(1, '#0D1117');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Top accent bar
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, W, 5);

      // Subtle vertical divider before QR section
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(720, 30, 1, H - 60);

      // ── Profile photo ──
      const photoSrc = resolvePhotoUrl(profile.photoUrl);
      if (photoSrc) {
        try {
          const img = await loadImage(photoSrc);
          const cx = 110, cy = 120, r = 80;
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
          ctx.restore();
          // Border ring
          ctx.beginPath();
          ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
          ctx.strokeStyle = accent;
          ctx.lineWidth = 3;
          ctx.stroke();
        } catch { /* skip photo if CORS fails */ }
      }

      // ── Text info ──
      // Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 44px Inter, Arial, sans-serif';
      ctx.fillText(profile.displayName, 60, 270);

      // Tagline
      if (profile.tagline) {
        ctx.fillStyle = accent;
        ctx.font = '22px Inter, Arial, sans-serif';
        ctx.fillText(profile.tagline, 60, 310);
      }

      // Bio
      if (profile.bio) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '18px Inter, Arial, sans-serif';
        const bio = profile.bio.length > 80 ? profile.bio.slice(0, 77) + '...' : profile.bio;
        ctx.fillText(bio, 60, profile.tagline ? 350 : 310);
      }

      // Location
      if (profile.location) {
        const locY = profile.bio ? 400 : (profile.tagline ? 355 : 315);
        ctx.fillStyle = 'rgba(255,255,255,0.40)';
        ctx.font = '17px Inter, Arial, sans-serif';
        ctx.fillText(`📍  ${profile.location}`, 60, locY);
      }

      // URL at bottom-left
      ctx.fillStyle = 'rgba(255,255,255,0.30)';
      ctx.font = '15px Inter, Arial, sans-serif';
      ctx.fillText(pageUrl, 60, H - 28);

      // ── QR Code (right panel) ──
      const qrSize = 210;
      const qrX = 760;
      const qrY = Math.round((H - qrSize) / 2) - 20;

      // White rounded background for QR
      ctx.fillStyle = '#FFFFFF';
      drawRoundRect(ctx, qrX - 18, qrY - 18, qrSize + 36, qrSize + 36, 18);
      ctx.fill();

      if (qrCanvas) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
      }

      // "Escaneie" label below QR
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '15px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Escaneie para ver', qrX + qrSize / 2, qrY + qrSize + 36 + 18);

      // ── CraftCard branding ──
      ctx.fillStyle = accent;
      ctx.font = 'bold 14px Inter, Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('CraftCard', W - 36, H - 22);
      ctx.textAlign = 'left';

      // Download
      const link = document.createElement('a');
      link.download = `cartão-${slug}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
  };

  /**
   * Gera imagem vertical otimizada para Instagram Stories (1080x1920).
   * Layout: fundo mesh gradient escuro, foto grande circular, nome, tagline,
   * mini QR Code no centro inferior, URL e branding CraftCard.
   * Parece um "print profissional" do cartao — ideal para compartilhar nos Stories.
   */
  const handleExportStories = async () => {
    if (!profile || !slug) return;
    setExporting(true);
    try {
      const qrCanvas = qrExportRef.current?.querySelector('canvas');
      const W = 1080, H = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Fundo mesh gradient escuro profissional
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#0A0E1A');
      bg.addColorStop(0.4, '#1A1A2E');
      bg.addColorStop(0.7, '#12082a');
      bg.addColorStop(1, '#0A0E1A');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Mesh blobs decorativos
      const blob1 = ctx.createRadialGradient(200, 500, 0, 200, 500, 400);
      blob1.addColorStop(0, accent + '30');
      blob1.addColorStop(1, 'transparent');
      ctx.fillStyle = blob1;
      ctx.fillRect(0, 100, 600, 800);

      const blob2 = ctx.createRadialGradient(880, 1400, 0, 880, 1400, 350);
      blob2.addColorStop(0, '#D12BF230');
      blob2.addColorStop(1, 'transparent');
      ctx.fillStyle = blob2;
      ctx.fillRect(530, 1050, 550, 700);

      // Barra de destaque no topo
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, W, 6);

      // Foto de perfil grande circular (raio 130px)
      const photoSrc = resolvePhotoUrl(profile.photoUrl);
      const cx = W / 2, cy = 520, r = 130;
      if (photoSrc) {
        try {
          const img = await loadImage(photoSrc);
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
          ctx.restore();
          // Anel ao redor da foto
          ctx.beginPath();
          ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
          ctx.strokeStyle = accent;
          ctx.lineWidth = 4;
          ctx.stroke();
        } catch { /* CORS fail */ }
      } else {
        // Placeholder com inicial
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = accent + '30';
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 80px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(displayName.charAt(0), cx, cy + 28);
      }

      // Nome
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 56px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      const nameText = displayName.length > 25 ? displayName.slice(0, 22) + '...' : displayName;
      ctx.fillText(nameText, cx, cy + r + 80);

      // Tagline
      let nextY = cy + r + 80;
      if (profile.tagline) {
        nextY += 50;
        ctx.fillStyle = accent;
        ctx.font = '30px Inter, Arial, sans-serif';
        const tag = profile.tagline.length > 40 ? profile.tagline.slice(0, 37) + '...' : profile.tagline;
        ctx.fillText(tag, cx, nextY);
      }

      // Bio
      if (profile.bio) {
        nextY += 50;
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '24px Inter, Arial, sans-serif';
        const bio = profile.bio.length > 70 ? profile.bio.slice(0, 67) + '...' : profile.bio;
        ctx.fillText(bio, cx, nextY);
      }

      // Linha separadora sutil
      nextY += 60;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(W / 2 - 100, nextY, 200, 1);

      // QR Code centralizado
      const qrSize = 280;
      const qrY = 1280;
      const qrX = (W - qrSize) / 2;

      // Fundo branco arredondado para QR
      ctx.fillStyle = '#FFFFFF';
      drawRoundRect(ctx, qrX - 24, qrY - 24, qrSize + 48, qrSize + 48, 24);
      ctx.fill();

      if (qrCanvas) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
      }

      // Texto abaixo do QR
      ctx.fillStyle = 'rgba(255,255,255,0.50)';
      ctx.font = '22px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Escaneie para ver meu cartão', cx, qrY + qrSize + 60);

      // URL
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '20px Inter, Arial, sans-serif';
      ctx.fillText(pageUrl, cx, H - 80);

      // Branding
      ctx.fillStyle = accent;
      ctx.font = 'bold 18px Inter, Arial, sans-serif';
      ctx.fillText('CraftCard', cx, H - 40);
      ctx.textAlign = 'left';

      // Download
      const link = document.createElement('a');
      link.download = `stories-${slug}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch { /* silently fail */ }
    finally { setExporting(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-brand-bg-dark flex flex-col items-center justify-center text-white gap-4 px-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-white/50">Este cartão não existe ou não está publicado</p>
        <Link to="/" className="text-brand-cyan hover:underline text-sm">
          Crie o seu no {APP_NAME}
        </Link>
      </div>
    );
  }

  // Calcula o background CSS baseado no tipo configurado (tema, gradiente, mesh, imagem)
  const computedBackground = (() => {
    if (bgType === 'gradient' && profile.backgroundGradient) {
      const parts = profile.backgroundGradient.split(',');
      if (parts.length >= 3) return `linear-gradient(${parts[0]},${parts[1]},${parts[2]})`;
    }
    // Mesh Gradient — busca o preset pelo ID e aplica o CSS de radial-gradient sobrepostos
    if (bgType === 'mesh' && profile.backgroundGradient) {
      const mesh = MESH_GRADIENTS.find((m) => m.value === profile.backgroundGradient);
      if (mesh) return mesh.css;
    }
    if (bgType === 'image' && profile.backgroundImageUrl) {
      return getThemeBackground(theme, accent);
    }
    return getThemeBackground(theme, accent);
  })();

  // Gate de captura de lead: se ativado, exibe formulario obrigatorio antes do cartao.
  // O visitante precisa informar nome e email para desbloquear o acesso.
  if (profile.leadCaptureEnabled && !leadGatePassed) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
        style={{ background: getThemeBackground(theme, accent) }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 backdrop-blur-xl bg-white/[0.08] border border-white/10 rounded-3xl shadow-2xl"
        >
          <div className="flex flex-col items-center mb-6">
            {profile.photoUrl && (
              <div
                className="w-20 h-20 rounded-full mb-4 shadow-xl border-4"
                style={{
                  borderColor: `${accent}40`,
                  backgroundImage: `url(${resolvePhotoUrl(profile.photoUrl)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}
            <h2 className="text-xl font-bold text-white text-center">{profile.displayName}</h2>
            <p className="text-sm text-white/50 text-center mt-2">
              Preencha seus dados para acessar o cartão
            </p>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={leadForm.name}
              onChange={(e) => setLeadForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Seu nome *"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50 transition-all"
            />
            <input
              type="email"
              value={leadForm.email}
              onChange={(e) => setLeadForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="Seu email *"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50 transition-all"
            />
            <button
              type="button"
              onClick={handleLeadSubmit}
              disabled={leadForm.name.length < 2 || !leadForm.email.includes('@') || leadSubmitting}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: accent }}
            >
              {leadSubmitting ? 'Acessando...' : 'Acessar Cartão'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${profile.displayName} — ${APP_NAME}`}</title>
        <meta name="description" content={profile.bio || `Cartão digital de ${profile.displayName}`} />
        <meta property="og:title" content={`${profile.displayName} — ${APP_NAME}`} />
        <meta property="og:description" content={profile.bio || `Cartão digital de ${profile.displayName}`} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={`${API_BASE}/api/og/image/${slug}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${profile.displayName} — ${APP_NAME}`} />
        <meta name="twitter:description" content={profile.bio || `Cartão digital de ${profile.displayName}`} />
        <meta name="twitter:image" content={`${API_BASE}/api/og/image/${slug}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: profile.displayName,
            ...(profile.bio && { description: profile.bio }),
            image: profile.photoUrl ? resolvePhotoUrl(profile.photoUrl) : `${API_BASE}/api/og/image/${slug}`,
            url: pageUrl,
            ...(profile.tagline && { jobTitle: profile.tagline }),
            sameAs: profile.socialLinks.map(l => l.url),
          })}
        </script>
      </Helmet>

      <div
        ref={cardRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12"
        style={{ background: computedBackground, fontFamily: `'${fontFamily}', sans-serif`, fontSize: `${fontScale}rem` }}
      >
        {/* Background image + overlay */}
        {bgType === 'image' && profile.backgroundImageUrl && (
          <>
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0" style={{ backgroundImage: `url(${profile.backgroundImageUrl})` }} />
            <div className="absolute inset-0 z-0" style={{ backgroundColor: `rgba(0,0,0,${profile.backgroundOverlay ?? 0.7})` }} />
          </>
        )}

        {/* Background pattern overlay */}
        {bgType === 'pattern' && profile.backgroundPattern && (
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <PatternOverlay pattern={profile.backgroundPattern} color={accent} />
          </div>
        )}
        {/* Animated background overlay */}
        {bgType === 'animated' && profile.backgroundPattern && (
          <AnimatedBackgroundOverlay pattern={profile.backgroundPattern} accent={accent} />
        )}
        <AnimatedBackground theme={theme} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative z-[1] w-full max-w-md sm:max-w-lg lg:max-w-2xl ${theme !== 'minimal' ? 'p-6' : ''} ${getThemeCardStyle(theme)}`}
        >
          {/* Cover Photo */}
          {profile.coverPhotoUrl && (
            <div
              className="w-full h-32 rounded-t-3xl bg-white/5"
              style={{
                backgroundImage: `url(${resolvePhotoUrl(profile.coverPhotoUrl)})`,
                backgroundSize: 'cover',
                backgroundPosition: `center ${profile.coverPositionY ?? 50}%`,
              }}
            />
          )}

          {/* Avatar */}
          <div className={`flex flex-col items-center mb-8 ${profile.coverPhotoUrl ? '-mt-14' : ''}`}>
            <div
              className="w-28 h-28 rounded-full mb-4 shadow-xl flex items-center justify-center border-4"
              style={{
                borderColor: profile.coverPhotoUrl ? '#1A1A2E' : `${accent}40`,
                background: resolvePhotoUrl(profile.photoUrl)
                  ? undefined
                  : `linear-gradient(135deg, ${accent}, #D12BF2)`,
                ...(resolvePhotoUrl(profile.photoUrl) ? {
                  backgroundImage: `url(${resolvePhotoUrl(profile.photoUrl)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: `center ${profile.photoPositionY ?? 50}%`,
                } : {}),
              }}
            >
              {!profile.photoUrl && <User className="w-12 h-12 text-white" />}
            </div>

            <h1 className="font-bold text-white text-center flex items-center justify-center gap-1.5 max-w-full truncate" style={{ fontSize: '1.5em' }}>
              {profile.displayName}
              {profile.isVerified && (
                <span title="Perfil verificado" className="inline-flex">
                  <BadgeCheck size={22} className="text-blue-400 shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(59,130,246,0.5))' }} />
                </span>
              )}
            </h1>

            {/* Availability Badge */}
            {profile.availabilityStatus && (
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  profile.availabilityStatus === 'available' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' :
                  profile.availabilityStatus === 'busy' ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]' :
                  'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'
                }`} />
                <span style={{ fontSize: '0.75em' }} className={`font-medium ${
                  profile.availabilityStatus === 'available' ? 'text-green-400' :
                  profile.availabilityStatus === 'busy' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {profile.availabilityStatus === 'available' ? 'Disponível' :
                   profile.availabilityStatus === 'busy' ? 'Ocupado' : 'Indisponível'}
                </span>
              </div>
            )}
            {profile.availabilityMessage && profile.availabilityStatus && (
              <p className="text-white/40 mt-1 break-words" style={{ fontSize: '0.75em' }}>{profile.availabilityMessage}</p>
            )}

            {profile.tagline && (
              <p className="text-white/40 text-center mt-1 italic line-clamp-2" style={{ fontSize: '0.75em' }}>{profile.tagline}</p>
            )}

            {profile.bio && (
              <p className="text-white/60 text-center mt-2 max-w-sm leading-relaxed" style={{ fontSize: '0.875em' }}>
                {profile.bio}
              </p>
            )}

            {/* Expanded bio info */}
            {(profile.location || profile.pronouns || profile.workingHours) && (
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                {profile.pronouns && (
                  <span className="text-white/30 px-2 py-0.5 rounded-full bg-white/5 truncate max-w-[200px]" style={{ fontSize: '0.625em' }}>{profile.pronouns}</span>
                )}
                {profile.location && (
                  <span className="text-white/30 px-2 py-0.5 rounded-full bg-white/5 truncate max-w-[200px]" style={{ fontSize: '0.625em' }}>{profile.location}</span>
                )}
                {profile.workingHours && (
                  <span className="text-white/30 px-2 py-0.5 rounded-full bg-white/5 truncate max-w-[200px]" style={{ fontSize: '0.625em' }}>{profile.workingHours}</span>
                )}
              </div>
            )}
          </div>

          {/* Save Contact (vCard) — CTA proeminente */}
          <motion.button
            onClick={() => handleDownloadVCard(profile)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-semibold text-sm shadow-lg transition-all mt-5 mb-2"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              color: '#fff',
              boxShadow: `0 4px 20px ${accent}40`,
            }}
          >
            <UserPlus size={18} />
            Salvar Contato
          </motion.button>

          {/* Video Intro */}
          {profile.videoUrl && (
            <div className="w-full rounded-xl overflow-hidden mb-4">
              <video
                src={profile.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="w-full max-h-48 object-cover rounded-xl"
              />
            </div>
          )}

          {/* Links (list or grid layout) */}
          {/* perspective necessário para animações 3D (tilt3d, flip) */}
          <div className={linkLayout === 'grid' ? 'grid grid-cols-3 gap-2.5' : 'space-y-3'} style={{ perspective: '800px', ...(linkLayout === 'grid' ? { gridAutoFlow: 'dense', gridAutoRows: 'minmax(90px, auto)' } : undefined) }}>
            {(() => {
              const allLinks = profile.socialLinks;
              const gridLimit = linkLayout === 'grid' ? 9 : 5;
              const visibleLinks = showAllLinks ? allLinks : allLinks.slice(0, gridLimit);
              const hiddenCount = allLinks.length - gridLimit;
              const Renderer = linkLayout === 'grid' ? GridLinkRenderer : LinkRenderer;

              return (
                <>
                  {visibleLinks.map((link, i) => (
                    <Renderer
                      key={link.id}
                      link={link}
                      index={i}
                      accent={accent}
                      linkStyle={linkStyle}
                      linkAnim={linkAnim}
                      iconStyle={iconStyle}
                    />
                  ))}
                  {hiddenCount > 0 && (
                    <motion.button
                      type="button"
                      onClick={() => setShowAllLinks(!showAllLinks)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-dashed border-white/15 text-white/50 hover:text-white/80 hover:border-white/30 hover:bg-white/5 transition-all text-sm ${linkLayout === 'grid' ? 'col-span-3' : 'w-full'}`}
                    >
                      {showAllLinks ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {showAllLinks
                        ? 'Ver menos'
                        : `Ver mais ${hiddenCount} ${hiddenCount === 1 ? 'link' : 'links'}`}
                    </motion.button>
                  )}
                </>
              );
            })()}
          </div>

          {/* Gallery / Portfolio */}
          {profile.galleryImages && profile.galleryImages.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3 px-1">
                <ImageIcon size={14} className="text-white/50" />
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Portfolio</span>
              </div>
              <GalleryGrid images={profile.galleryImages} />
            </div>
          )}

          {/* Services */}
          {profile.services && profile.services.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Briefcase size={14} className="text-amber-400/60" />
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Serviços</span>
              </div>
              <div className="space-y-2">
                {profile.services.map((s) => (
                  <div key={s.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white truncate">{s.title}</h4>
                        {s.description && <p className="text-xs text-white/50 mt-1">{s.description}</p>}
                      </div>
                      {s.price && (
                        <span className="text-sm font-semibold shrink-0" style={{ color: accent }}>{s.price}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ */}
          {profile.faqItems && profile.faqItems.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3 px-1">
                <HelpCircle size={14} className="text-indigo-400/60" />
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Perguntas Frequentes</span>
              </div>
              <div className="space-y-2">
                {profile.faqItems.map((item) => (
                  <FaqAccordion key={item.id} question={item.question} answer={item.answer} />
                ))}
              </div>
            </div>
          )}

          {/* Location Map */}
          {profile.location && (
            <LocationMap location={profile.location} accent={accent} />
          )}

          {/* Connections */}
          {profile.connectionsEnabled !== false && profile.connections && profile.connections.length > 0 && (
            <ConnectionsSection connections={profile.connections} accent={accent} />
          )}

          {/* Testimonials */}
          {profile.testimonials && profile.testimonials.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Star size={14} className="text-yellow-400" />
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Depoimentos</span>
              </div>
              <div className="space-y-3">
                {profile.testimonials.map((t) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <p className="text-sm text-white/70 italic leading-relaxed">"{t.text}"</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white/60">{t.authorName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium text-white/80 truncate block">{t.authorName}</span>
                        {t.authorRole && <span className="text-xs text-white/30 truncate block">· {t.authorRole}</span>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Leave Testimonial Button */}
          {profile.testimonialsEnabled !== false && (
          <motion.button
            type="button"
            onClick={() => setShowTestimonialForm(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.62 }}
            className="mt-3 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm"
          >
            <Star size={16} />
            Deixar Depoimento
          </motion.button>
          )}

          {/* Resume */}
          {profile.resumeUrl && (
            <motion.a
              href={`${resolvePhotoUrl(profile.resumeUrl) || profile.resumeUrl}?v=${Date.now()}`}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm"
            >
              <FileText size={16} />
              Ver Currículo
            </motion.a>
          )}

          {/* Contact Form Button */}
          {profile.contactFormEnabled !== false && (
          <motion.button
            type="button"
            onClick={() => setShowContactForm(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-3 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm"
          >
            <MessageSquare size={16} />
            Enviar Mensagem
          </motion.button>
          )}

          {/* Booking Button */}
          {publicSlots && publicSlots.length > 0 && (
            <motion.button
              type="button"
              onClick={() => setShowBooking(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-3 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: `${accent}30`, borderLeft: `3px solid ${accent}` }}
            >
              <CalendarDays size={16} />
              Agendar Reuniao
            </motion.button>
          )}

          {/* Connect Button — subtle footer placement for all plans */}
          {!isOwner && (
            <div className="mt-6">
              <ConnectButton
                targetProfileId={profile.id}
                accent={accent}
                isLoggedIn={isAuthenticated}
              />
            </div>
          )}

          {/* Share */}
          {/* Botoes de compartilhamento separados com gap adequado */}
          <div className="mt-6 flex justify-center gap-6">
            <button
              type="button"
              onClick={async () => {
                // Share nativo do sistema (WhatsApp, Discord, Teams, etc.)
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: `${displayName} — CraftCard`,
                      text: `Confira o cartão digital de ${displayName}`,
                      url: pageUrl,
                    });
                    return;
                  } catch {
                    // Cancelado — abre nosso modal como fallback
                  }
                }
                setShowShareModal(true);
              }}
              className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              <Share2 size={14} />
              Compartilhar
            </button>
            {/* Abre modal com opcoes avancadas (Instagram Stories, QR, Export) */}
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              <Instagram size={14} />
              Stories & Mais
            </button>
          </div>

          {/* QR Code + Download Card */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
              <CustomQrCode
                url={pageUrl}
                fgColor={accent}
                bgColor="#1A1A2E"
                size={140}
                frameText={displayName}
                showLogo={false}
                showActions={false}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportImage}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-white/10 bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 transition disabled:opacity-40"
              >
                <Download size={12} />
                {exporting ? 'Gerando...' : 'Baixar Cartão'}
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(pageUrl);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-white/10 bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 transition"
              >
                {linkCopied ? <Check size={12} /> : <Copy size={12} />}
                {linkCopied ? 'Copiado!' : 'Copiar Link'}
              </button>
              <button
                type="button"
                onClick={() => setShowPresentationMode(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-white/10 bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 transition"
              >
                <Scan size={12} />
                Apresentar
              </button>
            </div>
          </div>

          {/* Org branding badge */}
          {orgB && (
            <div className="mt-8 flex justify-center">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl border text-sm" style={{ backgroundColor: `${orgB.orgPrimaryColor}15`, borderColor: `${orgB.orgPrimaryColor}30` }}>
                {orgB.orgLogoUrl ? (
                  <img src={orgB.orgLogoUrl} alt="" className="w-6 h-6 rounded-lg object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: orgB.orgPrimaryColor }}>
                    {orgB.orgName[0]}
                  </div>
                )}
                <span className="text-white/70 font-medium">Membro de <strong className="text-white">{orgB.orgName}</strong></span>
              </div>
            </div>
          )}

          {/* Watermark — only shown for free tier */}
          {(!profile.plan || profile.plan === 'FREE') && (
            <div className="mt-12 flex justify-center">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-xs text-white/40 hover:text-white/60 hover:bg-white/10 transition-all"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan/60" />
                Feito com {APP_NAME}
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* Contact Form Modal */}
      <AnimatePresence>
        {showContactForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowContactForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare size={20} className="text-brand-cyan" />
                  Enviar Mensagem
                </h3>
                <button type="button" onClick={() => setShowContactForm(false)} title="Fechar" className="text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {contactSuccess ? (
                <div className="text-center py-8">
                  <Check size={40} className="mx-auto text-green-400 mb-3" />
                  <p className="text-white font-semibold">Mensagem enviada!</p>
                  <p className="text-sm text-white/40 mt-1">Sua mensagem foi entregue com sucesso.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={contactForm.senderName}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, senderName: e.target.value }))}
                    placeholder="Seu nome *"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50 transition-all"
                  />
                  <input
                    type="email"
                    value={contactForm.senderEmail}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, senderEmail: e.target.value }))}
                    placeholder="Seu email (opcional)"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50 transition-all"
                  />
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Sua mensagem *"
                    rows={4}
                    maxLength={1000}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50 transition-all resize-none"
                  />
                  <div className="flex justify-end">
                    <span className="text-xs text-white/20">{contactForm.message.length}/1000</span>
                  </div>
                  {sendMessage.isError && (
                    <p className="text-xs text-red-400">Erro ao enviar mensagem. Tente novamente.</p>
                  )}
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={contactForm.senderName.length < 2 || contactForm.message.length < 5 || sendMessage.isPending}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: accent }}
                  >
                    <Send size={16} />
                    {sendMessage.isPending ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Share2 size={20} className="text-brand-cyan" />
                  Compartilhar
                </h3>
                <button type="button" onClick={() => setShowShareModal(false)} title="Fechar" className="text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Confira o cartão de ${displayName}: ${pageUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-green-500/10 hover:border-green-500/30 transition-all"
                >
                  <MessageCircle size={24} className="text-green-400" />
                  <span className="text-xs text-white/70">WhatsApp</span>
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(`Confira o cartão de ${displayName}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all"
                >
                  <Send size={24} className="text-blue-400" />
                  <span className="text-xs text-white/70">Telegram</span>
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(`Cartão de ${displayName}`)}&body=${encodeURIComponent(`Confira: ${pageUrl}`)}`}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                >
                  <Mail size={24} className="text-red-400" />
                  <span className="text-xs text-white/70">Email</span>
                </a>
                {/* Botao Instagram Stories — gera imagem vertical 1080x1920 com foto, nome, QR */}
                <button
                  type="button"
                  onClick={async () => {
                    await handleExportStories();
                    setInstagramHint(true);
                    setTimeout(() => setInstagramHint(false), 4000);
                  }}
                  disabled={exporting}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-pink-500/10 hover:border-pink-500/30 transition-all"
                >
                  <Instagram size={24} className="text-pink-400" />
                  <span className="text-xs text-white/70">Stories</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-brand-cyan/10 hover:border-brand-cyan/30 transition-all"
                >
                  {linkCopied ? <Check size={24} className="text-green-400" /> : <Copy size={24} className="text-brand-cyan" />}
                  <span className="text-xs text-white/70">{linkCopied ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>
              {/* Dica exibida apos salvar imagem para compartilhar no Instagram */}
              <AnimatePresence>
                {instagramHint && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-2 text-center text-xs text-pink-300/80"
                  >
                    Imagem para Stories salva! Abra o Instagram → Stories → Galeria
                  </motion.p>
                )}
              </AnimatePresence>

              {/* QR Code — high-contrast for reliable scanning */}
              <div className="mt-4 flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="p-3 rounded-2xl bg-white">
                  <QRCodeCanvas
                    value={pageUrl}
                    size={200}
                    fgColor="#0A0E1A"
                    bgColor="#FFFFFF"
                    level="M"
                  />
                </div>
                <span className="text-[10px] text-white/30">Escaneie para acessar</span>
              </div>

              {/* Export as Image */}
              <button
                type="button"
                onClick={handleExportImage}
                disabled={exporting}
                className="mt-3 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm disabled:opacity-40"
              >
                <Download size={16} />
                {exporting ? 'Gerando imagem...' : 'Exportar como Imagem'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Testimonial Form Modal */}
      <AnimatePresence>
        {showTestimonialForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTestimonialForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Star size={20} className="text-yellow-400" />
                  Deixar Depoimento
                </h3>
                <button type="button" onClick={() => setShowTestimonialForm(false)} title="Fechar" className="text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {testimonialSuccess ? (
                <div className="text-center py-8">
                  <Check size={40} className="mx-auto text-green-400 mb-3" />
                  <p className="text-white font-semibold">Depoimento enviado!</p>
                  <p className="text-sm text-white/40 mt-1">Sera exibido apos aprovacao do proprietario.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={testimonialForm.authorName}
                    onChange={(e) => setTestimonialForm((prev) => ({ ...prev, authorName: e.target.value }))}
                    placeholder="Seu nome *"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50 transition-all"
                  />
                  <input
                    type="text"
                    value={testimonialForm.authorRole}
                    onChange={(e) => setTestimonialForm((prev) => ({ ...prev, authorRole: e.target.value }))}
                    placeholder="Seu cargo/empresa (opcional)"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50 transition-all"
                  />
                  <textarea
                    value={testimonialForm.text}
                    onChange={(e) => setTestimonialForm((prev) => ({ ...prev, text: e.target.value }))}
                    placeholder="Escreva seu depoimento *"
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50 transition-all resize-none"
                  />
                  <div className="flex justify-end">
                    <span className="text-xs text-white/20">{testimonialForm.text.length}/500</span>
                  </div>
                  {submitTestimonial.isError && (
                    <p className="text-xs text-red-400">Erro ao enviar depoimento. Tente novamente.</p>
                  )}
                  <button
                    type="button"
                    onClick={handleSubmitTestimonial}
                    disabled={testimonialForm.authorName.length < 2 || testimonialForm.text.length < 10 || submitTestimonial.isPending}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: accent }}
                  >
                    <Send size={16} />
                    {submitTestimonial.isPending ? 'Enviando...' : 'Enviar Depoimento'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBooking && slug && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBooking(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CalendarDays size={20} className="text-brand-cyan" />
                  Agendar Reuniao
                </h3>
                <button type="button" onClick={() => setShowBooking(false)} title="Fechar" className="text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <BookingCalendar slug={slug} accent={accent} onClose={() => setShowBooking(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Presentation Mode — hackathon fullscreen QR ── */}
      <AnimatePresence>
        {showPresentationMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black"
            onClick={() => setShowPresentationMode(false)}
          >
            <button
              type="button"
              aria-label="Fechar"
              className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"
              onClick={() => setShowPresentationMode(false)}
            >
              <X size={28} />
            </button>

            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              className="flex flex-col items-center gap-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Pulsing glow ring around QR */}
              <motion.div
                animate={{ boxShadow: [`0 0 0 0px ${accent}60`, `0 0 0 24px ${accent}00`] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                style={{ borderRadius: 24 }}
              >
                <div className="p-6 rounded-3xl bg-white shadow-2xl">
                  <QRCodeCanvas
                    value={pageUrl}
                    size={300}
                    fgColor="#0A0E1A"
                    bgColor="#FFFFFF"
                    level="M"
                  />
                </div>
              </motion.div>

              <div className="text-center">
                <p className="text-5xl font-bold text-white mb-3 tracking-tight">{displayName}</p>
                {profile.tagline && (
                  <p className="text-lg mb-2 text-brand-cyan">{profile.tagline}</p>
                )}
                <p className="text-white/30 text-sm font-mono">{pageUrl}</p>
              </div>

              <p className="text-white/20 text-xs mt-2">Toque para fechar</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden high-contrast QR canvas — used only for image export */}
      <div
        ref={qrExportRef}
        className="fixed -left-[9999px] -top-[9999px] pointer-events-none opacity-0"
        aria-hidden="true"
      >
        <QRCodeCanvas value={pageUrl} size={420} fgColor="#000000" bgColor="#FFFFFF" level="M" />
      </div>
    </>
  );
}
