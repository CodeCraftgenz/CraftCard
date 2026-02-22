import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { api } from '@/lib/api';
import { trackLinkClick } from '@/hooks/useAnalytics';
import { APP_NAME, resolvePhotoUrl } from '@/lib/constants';

interface PublicProfile {
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
  resumeUrl: string | null;
  buttonColor: string;
  cardTheme: string;
  coverPhotoUrl: string | null;
  viewCount: number;
  socialLinks: Array<{
    id: string;
    platform: string;
    label: string;
    url: string;
    order: number;
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

  const { data: profile, isLoading, error } = useQuery<PublicProfile>({
    queryKey: ['public-profile', slug],
    queryFn: () => api.get(`/profile/${slug}`),
    retry: false,
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: `${profile?.displayName} — ${APP_NAME}`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
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
        className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
        style={{ background: getThemeBackground(theme, accent) }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md ${theme !== 'minimal' ? 'p-6' : ''} ${getThemeCardStyle(theme)}`}
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

            {profile.bio && (
              <p className="text-sm text-white/60 text-center mt-2 max-w-sm leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            {profile.socialLinks.filter(l => l.platform !== 'custom').map((link, i) => {
              const Icon = platformIcons[link.platform] || Globe;
              const bgColor = platformColors[link.platform] || accent;

              return (
                <motion.a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackLinkClick(link.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-4 px-5 py-3.5 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${bgColor}20` }}
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
            className="mt-3 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            <Download size={16} />
            Salvar Contato
          </motion.button>

          {/* Share */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleShare}
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
    </>
  );
}
