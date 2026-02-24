import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryImage {
  id: string;
  imageUrl?: string | null;
  imageData?: string | null;
  caption: string | null;
  order: number;
}

function getImageSrc(img: GalleryImage): string {
  if (img.imageUrl) return img.imageUrl;
  if (img.imageData) return `data:image/webp;base64,${img.imageData}`;
  return '';
}

interface GalleryGridProps {
  images: GalleryImage[];
}

export function GalleryGrid({ images }: GalleryGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % images.length);
    }
  };
  const goPrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((img, i) => (
          <motion.button
            key={img.id}
            type="button"
            onClick={() => openLightbox(i)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
          >
            <img
              src={getImageSrc(img)}
              alt={img.caption || 'Galeria'}
              loading="lazy"
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            {img.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-[10px] text-white/80 truncate">{img.caption}</p>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button
              type="button"
              onClick={closeLightbox}
              aria-label="Fechar"
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10"
            >
              <X size={24} />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  aria-label="Anterior"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors z-10"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  aria-label="Proximo"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors z-10"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl max-h-[80vh] flex flex-col items-center"
            >
              <img
                src={getImageSrc(images[lightboxIndex])}
                alt={images[lightboxIndex].caption || 'Galeria'}
                className="max-w-full max-h-[70vh] object-contain rounded-xl"
              />
              {images[lightboxIndex].caption && (
                <p className="mt-3 text-sm text-white/70 text-center">{images[lightboxIndex].caption}</p>
              )}
              <p className="mt-1 text-xs text-white/30">{lightboxIndex + 1} / {images.length}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
