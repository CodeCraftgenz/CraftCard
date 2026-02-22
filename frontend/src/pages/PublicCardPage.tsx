import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Instagram,
  Linkedin,
  Github,
  Globe,
  Mail,
  MessageCircle,
  Youtube,
  Twitter,
  Music2,
  Link as LinkIcon,
  ExternalLink,
  Share2,
  FileText,
  User,
  Download,
  X,
  Send,
  Copy,
  Check,
  QrCode,
  MessageSquare,
  Star,
  ChevronDown,
} from 'lucide-react';
import { api } from '@/lib/api';
import { trackLinkClick } from '@/hooks/useAnalytics';
import { useSendMessage } from '@/hooks/useContacts';
import { useSubmitTestimonial } from '@/hooks/useTestimonials';
import { APP_NAME, resolvePhotoUrl } from '@/lib/constants';

interface PublicProfile {
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
  resumeUrl: string | null;
  buttonColor: string;
  cardTheme: string;
  coverPhotoUrl: string | null;
  availabilityStatus: string | null;
  availabilityMessage: string | null;
  viewCount: number;
  socialLinks: Array<{
    id: string;
    platform: string;
    label: string;
    url: string;
    order: number;
  }>;
  testimonials?: Array<{
    id: string;
    authorName: string;
    authorRole: string | null;
    text: string;
    createdAt: string;
  }>;
  user?: {
    name: string;
    email: string;
  };
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
  const cardRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();
  const submitTestimonial = useSubmitTestimonial();

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

  const accent = profile.buttonColor || '#00E4F2';
  const theme = profile.cardTheme || 'default';

  return (
    <>
      <Helmet>
        <title>{`${profile.displayName} — ${APP_NAME}`}</title>
        <meta name="description" content={profile.bio || `Cartao digital de ${profile.displayName}`} />
        <meta property="og:title" content={`${profile.displayName} — ${APP_NAME}`} />
        <meta property="og:description" content={profile.bio || `Cartao digital de ${profile.displayName}`} />
        {profile.photoUrl && <meta property="og:image" content={resolvePhotoUrl(profile.photoUrl) || ''} />}
      </Helmet>

      <div
        ref={cardRef}
        className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
        style={{ background: getThemeBackground(theme, accent) }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md sm:max-w-lg ${theme !== 'minimal' ? 'p-6' : ''} ${getThemeCardStyle(theme)}`}
        >
          {/* Cover Photo */}
          {profile.coverPhotoUrl && (
            <div
              className="w-full h-32 rounded-t-3xl bg-white/5"
              style={{
                backgroundImage: `url(${resolvePhotoUrl(profile.coverPhotoUrl)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
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
                  ? `url(${resolvePhotoUrl(profile.photoUrl)}) center/cover`
                  : `linear-gradient(135deg, ${accent}, #D12BF2)`,
              }}
            >
              {!profile.photoUrl && <User className="w-12 h-12 text-white" />}
            </div>

            <h1 className="text-2xl font-bold text-white text-center">{profile.displayName}</h1>

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

            {profile.bio && (
              <p className="text-sm text-white/60 text-center mt-2 max-w-sm leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            {(() => {
              const socialOnly = profile.socialLinks.filter(l => l.platform !== 'custom');
              const visibleLinks = showAllLinks ? socialOnly : socialOnly.slice(0, 3);
              const hiddenCount = socialOnly.length - 3;

              return (
                <>
                  {visibleLinks.map((link, i) => {
                    const Icon = platformIcons[link.platform] || Globe;
                    const bgColor = platformColors[link.platform] || accent;
                    const isMailto = link.url.startsWith('mailto:');

                    return (
                      <motion.a
                        key={link.id}
                        href={link.url}
                        {...(!isMailto && { target: '_blank', rel: 'noopener noreferrer' })}
                        onClick={() => trackLinkClick(link.id)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-4 px-5 py-3.5 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group"
                        style={{ borderLeft: `3px solid ${accent}` }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${accent}20` }}
                        >
                          <Icon size={20} style={{ color: bgColor }} />
                        </div>
                        <span className="font-medium text-sm">{link.label}</span>
                        <span className="ml-auto text-white/20 group-hover:text-white/40 transition-colors">
                          &rsaquo;
                        </span>
                      </motion.a>
                    );
                  })}
                  {hiddenCount > 0 && !showAllLinks && (
                    <motion.button
                      type="button"
                      onClick={() => setShowAllLinks(true)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-dashed border-white/15 text-white/50 hover:text-white/80 hover:border-white/30 hover:bg-white/5 transition-all text-sm"
                    >
                      <ChevronDown size={16} />
                      Ver mais {hiddenCount} {hiddenCount === 1 ? 'link' : 'links'}
                    </motion.button>
                  )}
                </>
              );
            })()}
          </div>

          {/* Custom Links (Link-in-bio style) */}
          {profile.socialLinks.filter(l => l.platform === 'custom').length > 0 && (
            <div className="mt-4 space-y-3">
              {profile.socialLinks.filter(l => l.platform === 'custom').map((link, i) => (
                <motion.a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackLinkClick(link.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (profile.socialLinks.filter(l => l.platform !== 'custom').length + i) * 0.08 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="block w-full text-center px-5 py-3.5 rounded-2xl font-semibold text-sm text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: `${accent}30`, borderLeft: `3px solid ${accent}` }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <ExternalLink size={16} style={{ color: accent }} />
                    <span>{link.label}</span>
                  </div>
                </motion.a>
              ))}
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
              href={profile.resumeUrl}
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

          {/* Share */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              <Share2 size={14} />
              Compartilhar
            </button>
          </div>

          {/* Brand Badge */}
          <div className="mt-12 text-center">
            <Link
              to="/"
              className="text-xs text-white/20 hover:text-white/40 transition-colors"
            >
              Feito com {APP_NAME}
            </Link>
          </div>
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
                <QrCode size={20} className="text-white/50" />
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(pageUrl)}&bgcolor=1A1A2E&color=00E4F2&format=svg`}
                  alt="QR Code"
                  className="w-32 h-32 rounded-lg"
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
    </>
  );
}
