import { motion } from 'framer-motion';
import {
  Instagram,
  Linkedin,
  Github,
  Globe,
  Mail,
  MessageCircle,
  ExternalLink,
  User,
  BadgeCheck,
} from 'lucide-react';

interface CardPreviewProps {
  displayName?: string;
  bio?: string;
  photoUrl?: string;
  coverPhotoUrl?: string;
  buttonColor?: string;
  cardTheme?: string;
  availabilityStatus?: string;
  photoPositionY?: number;
  coverPositionY?: number;
  isVerified?: boolean;
  socialLinks?: Array<{
    platform: string;
    label: string;
    url: string;
  }>;
  demo?: boolean;
}

const DEMO_CARD: CardPreviewProps = {
  displayName: 'Maria Silva',
  bio: 'Designer & Criadora de Conteudo. Ajudo marcas a crescerem com design autenticado e estrategias criativas.',
  buttonColor: '#00E4F2',
  socialLinks: [
    { platform: 'instagram', label: 'Instagram', url: '#' },
    { platform: 'linkedin', label: 'LinkedIn', url: '#' },
    { platform: 'email', label: 'Email', url: '#' },
    { platform: 'whatsapp', label: 'WhatsApp', url: '#' },
  ],
};

const platformIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  website: Globe,
  email: Mail,
  whatsapp: MessageCircle,
  custom: ExternalLink,
};

export function CardPreview({
  displayName,
  bio,
  photoUrl,
  coverPhotoUrl,
  buttonColor,
  cardTheme,
  availabilityStatus,
  photoPositionY = 50,
  coverPositionY = 50,
  isVerified,
  socialLinks,
  demo,
}: CardPreviewProps) {
  const card = demo ? DEMO_CARD : { displayName, bio, photoUrl, coverPhotoUrl, buttonColor, cardTheme, availabilityStatus, photoPositionY, coverPositionY, isVerified, socialLinks };
  const accent = card.buttonColor || '#00E4F2';

  return (
    <motion.div
      initial={demo ? { opacity: 0, scale: 0.95 } : false}
      animate={demo ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.5 }}
      className="w-full max-w-[340px] mx-auto"
    >
      <div
        className="rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: `linear-gradient(180deg, ${accent}15 0%, #16213E 40%)`,
        }}
      >
        {/* Cover Photo */}
        {card.coverPhotoUrl && (
          <div
            className="w-full h-20 bg-white/5"
            style={{
              backgroundImage: `url(${card.coverPhotoUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: `center ${card.coverPositionY ?? 50}%`,
            }}
          />
        )}

        <div className={`p-6 flex flex-col items-center text-center ${card.coverPhotoUrl ? '-mt-10' : ''}`}>
          {/* Avatar */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-lg border-4 border-[#16213E]"
            style={{
              background: card.photoUrl
                ? undefined
                : `linear-gradient(135deg, ${accent}, #D12BF2)`,
              ...(card.photoUrl ? {
                backgroundImage: `url(${card.photoUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: `center ${card.photoPositionY ?? 50}%`,
              } : {}),
            }}
          >
            {!card.photoUrl && <User className="w-10 h-10 text-white" />}
          </div>

          {/* Name */}
          <h3 className="text-xl font-bold text-white mb-1 flex items-center justify-center gap-1">
            {card.displayName || 'Seu Nome'}
            {card.isVerified && (
              <BadgeCheck size={18} className="text-blue-400 shrink-0" />
            )}
          </h3>

          {/* Availability Badge */}
          {card.availabilityStatus && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className={`w-2 h-2 rounded-full ${
                card.availabilityStatus === 'available' ? 'bg-green-400' :
                card.availabilityStatus === 'busy' ? 'bg-yellow-400' : 'bg-red-400'
              }`} />
              <span className="text-[11px] text-white/50">
                {card.availabilityStatus === 'available' ? 'Disponivel' :
                 card.availabilityStatus === 'busy' ? 'Ocupado' : 'Indisponivel'}
              </span>
            </div>
          )}

          {/* Bio */}
          {card.bio && (
            <p className="text-sm text-white/60 mb-6 leading-relaxed max-w-[260px]">
              {card.bio}
            </p>
          )}

          {/* Social Links */}
          <div className="w-full flex flex-col gap-2.5">
            {(card.socialLinks || []).map((link, i) => {
              const Icon = platformIcons[link.platform] || Globe;
              return (
                <motion.a
                  key={i}
                  href={demo ? undefined : link.url}
                  target={demo ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-white font-medium text-sm transition-all"
                  style={{
                    backgroundColor: `${accent}20`,
                    borderLeft: `3px solid ${accent}`,
                  }}
                >
                  <Icon size={18} style={{ color: accent }} />
                  <span>{link.label}</span>
                  <span className="ml-auto text-white/30">&rsaquo;</span>
                </motion.a>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
