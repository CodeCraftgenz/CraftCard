import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, User } from 'lucide-react';
import { resolvePhotoUrl } from '@/lib/constants';

interface ConnectionProfile {
  id: string;
  displayName: string;
  photoUrl: string | null;
  slug: string;
  tagline: string | null;
}

interface ConnectionsSectionProps {
  connections: ConnectionProfile[];
  accent: string;
}

export function ConnectionsSection({ connections, accent }: ConnectionsSectionProps) {
  if (!connections || connections.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-6"
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <Users size={14} style={{ color: accent }} className="opacity-70" />
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          Conexoes
        </span>
        <span className="text-[10px] text-white/30 ml-1">({connections.length})</span>
      </div>

      <div
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {connections.map((conn, i) => (
          <Link
            key={conn.id}
            to={`/${conn.slug}`}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-white/30 transition-colors"
              style={{ borderColor: `${accent}30` }}
            >
              {conn.photoUrl ? (
                <img
                  src={resolvePhotoUrl(conn.photoUrl)}
                  alt={conn.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/10">
                  <User size={20} className="text-white/40" />
                </div>
              )}
            </motion.div>
            <span className="text-[10px] text-white/50 truncate max-w-[60px] text-center group-hover:text-white/70 transition-colors">
              {conn.displayName.split(' ')[0]}
            </span>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
