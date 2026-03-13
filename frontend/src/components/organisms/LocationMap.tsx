import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ExternalLink } from 'lucide-react';

interface LocationMapProps {
  location: string;
  accent?: string;
}

export function LocationMap({ location, accent = '#6366f1' }: LocationMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const encodedLocation = encodeURIComponent(location);
  const embedUrl = `https://www.google.com/maps?q=${encodedLocation}&output=embed`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;

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

      <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
        {/* Map embed */}
        {!mapError ? (
          <div className="relative w-full" style={{ height: 200 }}>
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            )}
            <iframe
              title="Localização"
              src={embedUrl}
              width="100%"
              height="200"
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.95) contrast(0.9)' }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setMapLoaded(true)}
              onError={() => setMapError(true)}
              className={mapLoaded ? 'opacity-100' : 'opacity-0'}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[120px] text-white/30 text-xs">
            Nao foi possivel carregar o mapa
          </div>
        )}

        {/* Location info + link */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <MapPin size={14} className="text-white/40 shrink-0" />
            <span className="text-sm text-white/70 truncate">{location}</span>
          </div>
          <ExternalLink size={14} className="text-white/30 shrink-0 group-hover:text-white/60 transition-colors" />
        </a>
      </div>
    </motion.div>
  );
}
