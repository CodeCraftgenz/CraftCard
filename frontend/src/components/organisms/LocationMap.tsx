import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ExternalLink } from 'lucide-react';

interface LocationMapProps {
  location: string;
  accent?: string;
}

export function LocationMap({ location, accent = '#6366f1' }: LocationMapProps) {
  const [imgError, setImgError] = useState(false);

  const encodedLocation = encodeURIComponent(location);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
  // Static map image via Google Maps embed screenshot (no API key needed)
  const embedUrl = `https://www.google.com/maps?q=${encodedLocation}&output=embed`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-6"
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <MapPin size={14} style={{ color: accent }} className="opacity-70" />
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          Onde me encontrar
        </span>
      </div>

      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:border-white/20 transition-all group"
      >
        {/* Map visual */}
        <div className="relative w-full" style={{ height: 180 }}>
          {!imgError ? (
            <iframe
              title="Localização"
              src={embedUrl}
              width="100%"
              height="180"
              style={{ border: 0, pointerEvents: 'none' }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white/30 text-xs">
              <MapPin size={24} className="mr-2 opacity-50" />
              {location}
            </div>
          )}
        </div>

        {/* Location bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 group-hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin size={14} className="text-white/40 shrink-0" />
            <span className="text-sm text-white/70 truncate">{location}</span>
          </div>
          <ExternalLink size={14} className="text-white/30 shrink-0 group-hover:text-white/60 transition-colors" />
        </div>
      </a>
    </motion.div>
  );
}
