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
  Share2,
  FileText,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';
import { APP_NAME, resolvePhotoUrl } from '@/lib/constants';

interface PublicProfile {
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
  resumeUrl: string | null;
  buttonColor: string;
  socialLinks: Array<{
    platform: string;
    label: string;
    url: string;
    order: number;
  }>;
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
        style={{
          background: `linear-gradient(180deg, ${accent}15 0%, #1A1A2E 30%, #1A1A2E 100%)`,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-28 h-28 rounded-full mb-4 shadow-xl flex items-center justify-center border-4"
              style={{
                borderColor: `${accent}40`,
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
            {profile.socialLinks.map((link, i) => {
              const Icon = platformIcons[link.platform] || Globe;
              const bgColor = platformColors[link.platform] || accent;

              return (
                <motion.a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
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
