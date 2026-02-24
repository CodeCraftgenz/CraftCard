import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { useParams, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { CustomQrCode } from '@/components/organisms/CustomQrCode';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground';
import { GalleryGrid } from '@/components/organisms/GalleryGrid';
import { LinkRenderer } from '@/components/organisms/LinkRenderer';
import { BookingCalendar } from '@/components/organisms/BookingCalendar';
import { api } from '@/lib/api';
import { trackViewEvent } from '@/hooks/useAnalytics';
import { usePublicSlots } from '@/hooks/useBookings';
import { useSendMessage } from '@/hooks/useContacts';
import { useSubmitTestimonial } from '@/hooks/useTestimonials';
import { API_BASE, APP_NAME, resolvePhotoUrl } from '@/lib/constants';
import { loadGoogleFont } from '@/lib/google-fonts';

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
  linkStyle?: string | null;
  linkAnimation?: string | null;
  leadCaptureEnabled?: boolean;
  bookingEnabled?: boolean;
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
    default:
      return 'backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl';
  }
}

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
    default:
      return null;
  }
}

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

function generateVCard(profile: PublicProfile): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${profile.displayName}`,
  ];

  if (profile.bio) {
    lines.push(`NOTE:${profile.bio.replace(/\n/g, '\\n')}`);
  }

  if (profile.photoUrl) {
    lines.push(`PHOTO;TYPE=URL:${resolvePhotoUrl(profile.photoUrl)}`);
  }

  const emailLink = profile.socialLinks.find((l) => l.platform === 'email');
  if (emailLink) {
    const email = emailLink.url.replace('mailto:', '');
    lines.push(`EMAIL:${email}`);
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

  lines.push(`URL:${window.location.href}`);
  lines.push('END:VCARD');

  return lines.join('\r\n');
}

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

export function PublicCardPage() {
  const { slug } = useParams<{ slug: string }>();
  const [showContactForm, setShowContactForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [contactForm, setContactForm] = useState({ senderName: '', senderEmail: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({ authorName: '', authorRole: '', text: '' });
  const [testimonialSuccess, setTestimonialSuccess] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showAllLinks, setShowAllLinks] = useState(false);
  const [leadGatePassed, setLeadGatePassed] = useState(() => {
    if (!slug) return false;
    return localStorage.getItem(`lead-${slug}`) === 'true';
  });
  const [leadForm, setLeadForm] = useState({ name: '', email: '' });
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();
  const submitTestimonial = useSubmitTestimonial();
  const { data: publicSlots } = usePublicSlots(slug);

  const { data: profile, isLoading, error } = useQuery<PublicProfile>({
    queryKey: ['public-profile', slug],
    queryFn: () => api.get(`/profile/${slug}`),
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

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

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const displayName = profile?.displayName || '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pageUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleExportImage = async () => {
    if (!cardRef.current || !slug) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#1A1A2E',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `cartao-${slug}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
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
        <p className="text-white/50">Este cartao nao existe ou nao esta publicado</p>
        <Link to="/" className="text-brand-cyan hover:underline text-sm">
          Crie o seu no {APP_NAME}
        </Link>
      </div>
    );
  }

  // Org branding overrides visual settings
  const orgB = profile.orgBranding;
  const accent = orgB?.orgPrimaryColor || profile.buttonColor || '#00E4F2';
  const theme = profile.cardTheme || 'default';
  const fontFamily = orgB?.orgFontFamily || profile.fontFamily || 'Inter';
  const fontScale = profile.fontSizeScale ?? 1;
  const bgType = profile.backgroundType || 'theme';
  const linkStyle = profile.linkStyle || 'rounded';
  const linkAnim = profile.linkAnimation || 'none';

  // Load custom Google Font
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadGoogleFont(fontFamily); }, [fontFamily]);

  // Track view event with device/referrer info (fire once)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { trackViewEvent(profile.id); }, [profile.id]);

  // Compute background based on backgroundType
  const computedBackground = (() => {
    if (bgType === 'gradient' && profile.backgroundGradient) {
      const parts = profile.backgroundGradient.split(',');
      if (parts.length >= 3) return `linear-gradient(${parts[0]},${parts[1]},${parts[2]})`;
    }
    return getThemeBackground(theme, accent);
  })();

  // Lead capture gate
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
              Preencha seus dados para acessar o cartao
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
              {leadSubmitting ? 'Acessando...' : 'Acessar Cartao'}
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
        <meta name="description" content={profile.bio || `Cartao digital de ${profile.displayName}`} />
        <meta property="og:title" content={`${profile.displayName} — ${APP_NAME}`} />
        <meta property="og:description" content={profile.bio || `Cartao digital de ${profile.displayName}`} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={`${API_BASE}/api/og/image/${slug}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${profile.displayName} — ${APP_NAME}`} />
        <meta name="twitter:description" content={profile.bio || `Cartao digital de ${profile.displayName}`} />
        <meta name="twitter:image" content={`${API_BASE}/api/og/image/${slug}`} />
      </Helmet>

      <div
        ref={cardRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12"
        style={{ background: computedBackground, fontFamily: `'${fontFamily}', sans-serif`, fontSize: `${fontScale}rem` }}
      >
        {/* Background pattern overlay */}
        {bgType === 'pattern' && profile.backgroundPattern && (
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <PatternOverlay pattern={profile.backgroundPattern} color={accent} />
          </div>
        )}
        <AnimatedBackground theme={theme} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md sm:max-w-lg lg:max-w-2xl ${theme !== 'minimal' ? 'p-6' : ''} ${getThemeCardStyle(theme)}`}
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

            <h1 className="text-2xl font-bold text-white text-center flex items-center justify-center gap-1.5">
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
                <span className={`text-xs font-medium ${
                  profile.availabilityStatus === 'available' ? 'text-green-400' :
                  profile.availabilityStatus === 'busy' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {profile.availabilityStatus === 'available' ? 'Disponivel' :
                   profile.availabilityStatus === 'busy' ? 'Ocupado' : 'Indisponivel'}
                </span>
              </div>
            )}
            {profile.availabilityMessage && profile.availabilityStatus && (
              <p className="text-xs text-white/40 mt-1">{profile.availabilityMessage}</p>
            )}

            {profile.tagline && (
              <p className="text-xs text-white/40 text-center mt-1 italic">{profile.tagline}</p>
            )}

            {profile.bio && (
              <p className="text-sm text-white/60 text-center mt-2 max-w-sm leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Expanded bio info */}
            {(profile.location || profile.pronouns || profile.workingHours) && (
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                {profile.pronouns && (
                  <span className="text-[10px] text-white/30 px-2 py-0.5 rounded-full bg-white/5">{profile.pronouns}</span>
                )}
                {profile.location && (
                  <span className="text-[10px] text-white/30 px-2 py-0.5 rounded-full bg-white/5">{profile.location}</span>
                )}
                {profile.workingHours && (
                  <span className="text-[10px] text-white/30 px-2 py-0.5 rounded-full bg-white/5">{profile.workingHours}</span>
                )}
              </div>
            )}
          </div>

          {/* Links (all types rendered via LinkRenderer) */}
          <div className="space-y-3">
            {(() => {
              const allLinks = profile.socialLinks;
              const visibleLinks = showAllLinks ? allLinks : allLinks.slice(0, 5);
              const hiddenCount = allLinks.length - 5;

              return (
                <>
                  {visibleLinks.map((link, i) => (
                    <LinkRenderer
                      key={link.id}
                      link={link}
                      index={i}
                      accent={accent}
                      linkStyle={linkStyle}
                      linkAnim={linkAnim}
                    />
                  ))}
                  {hiddenCount > 0 && (
                    <motion.button
                      type="button"
                      onClick={() => setShowAllLinks(!showAllLinks)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-dashed border-white/15 text-white/50 hover:text-white/80 hover:border-white/30 hover:bg-white/5 transition-all text-sm"
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
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Servicos</span>
              </div>
              <div className="space-y-2">
                {profile.services.map((s) => (
                  <div key={s.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white">{s.title}</h4>
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
                      <div>
                        <span className="text-xs font-medium text-white/80">{t.authorName}</span>
                        {t.authorRole && <span className="text-xs text-white/30 ml-1">· {t.authorRole}</span>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Leave Testimonial Button */}
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
              Ver Curriculo
            </motion.a>
          )}

          {/* Save Contact (vCard) */}
          <motion.button
            onClick={() => handleDownloadVCard(profile)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-3 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm"
          >
            <Download size={16} />
            Salvar Contato
          </motion.button>

          {/* Contact Form Button */}
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

          {/* Share */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={async () => {
                // Try Web Share API first (mobile)
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: `${displayName} — CraftCard`,
                      text: `Confira o cartao digital de ${displayName}`,
                      url: pageUrl,
                    });
                    return;
                  } catch {
                    // User cancelled or share failed — fallback to modal
                  }
                }
                setShowShareModal(true);
              }}
              className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              <Share2 size={14} />
              Compartilhar
            </button>
          </div>

          {/* Org branding badge */}
          {orgB && (
            <div className="mt-8 flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-xs text-white/40">
                {orgB.orgLogoUrl && <img src={orgB.orgLogoUrl} alt="" className="w-4 h-4 rounded" />}
                <span>{orgB.orgName}</span>
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
                  href={`https://wa.me/?text=${encodeURIComponent(`Confira o cartao de ${displayName}: ${pageUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-green-500/10 hover:border-green-500/30 transition-all"
                >
                  <MessageCircle size={24} className="text-green-400" />
                  <span className="text-xs text-white/70">WhatsApp</span>
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(`Confira o cartao de ${displayName}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all"
                >
                  <Send size={24} className="text-blue-400" />
                  <span className="text-xs text-white/70">Telegram</span>
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(`Cartao de ${displayName}`)}&body=${encodeURIComponent(`Confira: ${pageUrl}`)}`}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                >
                  <Mail size={24} className="text-red-400" />
                  <span className="text-xs text-white/70">Email</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-brand-cyan/10 hover:border-brand-cyan/30 transition-all"
                >
                  {linkCopied ? <Check size={24} className="text-green-400" /> : <Copy size={24} className="text-brand-cyan" />}
                  <span className="text-xs text-white/70">{linkCopied ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>

              {/* QR Code */}
              <div className="mt-4 flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10">
                <CustomQrCode
                  url={pageUrl}
                  fgColor={accent}
                  bgColor="#1A1A2E"
                  logoUrl={resolvePhotoUrl(profile.photoUrl)}
                  size={160}
                />
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
    </>
  );
}
