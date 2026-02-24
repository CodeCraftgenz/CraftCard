import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, MessageCircle, Instagram, Linkedin, Github, Globe, Mail, Youtube, Twitter, Music2, Link as LinkIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { resolvePhotoUrl, APP_NAME } from '@/lib/constants';

const PLATFORM_ICONS: Record<string, typeof ExternalLink> = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  youtube: Youtube,
  twitter: Twitter,
  website: Globe,
  email: Mail,
  tiktok: Music2,
  other: LinkIcon,
  custom: ExternalLink,
};

interface WidgetProfile {
  displayName: string;
  bio: string | null;
  tagline: string | null;
  photoUrl: string | null;
  buttonColor: string | null;
  slug: string;
  socialLinks: Array<{ platform: string; label: string; url: string }>;
}

export function WidgetPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: profile, isLoading, error } = useQuery<WidgetProfile>({
    queryKey: ['widget', slug],
    queryFn: () => api.get(`/profile/${slug}`).then((r) => r.data),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="w-[300px] h-[400px] bg-[#1A1A2E] rounded-2xl flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="w-[300px] h-[400px] bg-[#1A1A2E] rounded-2xl flex items-center justify-center p-4">
        <p className="text-white/50 text-sm text-center">Cartao nao encontrado</p>
      </div>
    );
  }

  const accent = profile.buttonColor || '#00E4F2';
  const photo = resolvePhotoUrl(profile.photoUrl);
  const visibleLinks = profile.socialLinks
    .filter((l) => l.url && !['header', 'pix'].includes(l.platform))
    .slice(0, 4);

  return (
    <div
      className="w-[300px] bg-[#1A1A2E] rounded-2xl overflow-hidden border border-white/10 flex flex-col"
      style={{ minHeight: 380 }}
    >
      {/* Header accent bar */}
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${accent}, #D12BF2)` }} />

      {/* Profile section */}
      <div className="flex flex-col items-center pt-6 pb-4 px-4">
        {photo ? (
          <img src={photo} alt={profile.displayName} className="w-16 h-16 rounded-full object-cover border-2" style={{ borderColor: accent }} />
        ) : (
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-2xl font-bold">
            {profile.displayName.charAt(0)}
          </div>
        )}
        <h3 className="mt-3 text-white font-bold text-base text-center">{profile.displayName}</h3>
        {(profile.tagline || profile.bio) && (
          <p className="mt-1 text-white/50 text-xs text-center line-clamp-2">
            {(profile.tagline || profile.bio || '').slice(0, 80)}
          </p>
        )}
      </div>

      {/* Links */}
      <div className="flex-1 px-4 space-y-2">
        {visibleLinks.map((link) => {
          const Icon = PLATFORM_ICONS[link.platform] || ExternalLink;
          return (
            <a
              key={link.platform + link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-white text-xs hover:opacity-80 transition-opacity"
              style={{ backgroundColor: accent + '1A', border: `1px solid ${accent}33` }}
            >
              <Icon size={14} style={{ color: accent }} />
              <span className="truncate">{link.label}</span>
            </a>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 pt-3">
        <a
          href={`${window.location.origin}/${profile.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-2.5 rounded-xl text-white text-xs font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: accent }}
        >
          Ver cartao completo
        </a>
        <p className="mt-2 text-center text-[9px] text-white/20">
          {APP_NAME}
        </p>
      </div>
    </div>
  );
}
