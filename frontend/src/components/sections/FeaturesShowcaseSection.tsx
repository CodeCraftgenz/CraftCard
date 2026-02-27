import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Link2, Smartphone, Wifi, BarChart3, Share2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  image: string;
  imageAlt: string;
  badge: string;
  title: string;
  description: string;
  bullets: { icon: LucideIcon; text: string }[];
  reverse?: boolean;
}

const features: Feature[] = [
  {
    image: '/feature-qrcode.jpg',
    imageAlt: 'QR Code holografico com cartao digital',
    badge: 'Compartilhamento',
    title: 'QR Code inteligente',
    description:
      'Gere um QR Code exclusivo para seu cartao digital. Perfeito para eventos, reunioes e networking presencial.',
    bullets: [
      { icon: QrCode, text: 'QR Code unico e personalizado' },
      { icon: Share2, text: 'Compartilhe em qualquer lugar' },
      { icon: BarChart3, text: 'Rastreie cada scan em tempo real' },
    ],
  },
  {
    image: '/feature-social-links.jpg',
    imageAlt: 'Redes sociais conectadas com rastreamento',
    badge: 'Redes sociais',
    title: 'Todos os seus links em um so lugar',
    description:
      'Conecte Instagram, LinkedIn, WhatsApp, TikTok e muito mais. Cada clique e rastreado para voce entender o que funciona.',
    bullets: [
      { icon: Link2, text: 'Links ilimitados com icones automaticos' },
      { icon: BarChart3, text: 'Analytics por link e plataforma' },
      { icon: Wifi, text: 'Atualize links sem trocar o QR Code' },
    ],
    reverse: true,
  },
  {
    image: '/feature-pwa.jpg',
    imageAlt: 'PWA instalacao como app nativo',
    badge: 'Tecnologia',
    title: 'Instale como app nativo',
    description:
      'Seu cartao funciona como um app instalado no celular. Acesso offline, notificacoes push e carregamento instantaneo.',
    bullets: [
      { icon: Smartphone, text: 'PWA com acesso direto na tela inicial' },
      { icon: Wifi, text: 'Funciona mesmo sem internet' },
      { icon: QrCode, text: 'Abra seu cartao em 1 segundo' },
    ],
  },
];

/* Slide-in from the side the image is on */
const imageVariants = (fromRight?: boolean) => ({
  initial: { opacity: 0, x: fromRight ? 60 : -60, scale: 0.92 },
  whileInView: { opacity: 1, x: 0, scale: 1 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
});

const textVariants = (fromRight?: boolean) => ({
  initial: { opacity: 0, x: fromRight ? -40 : 40 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 },
});

const bulletVariants = {
  initial: { opacity: 0, x: -12 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: '-60px' },
};

function FeatureImage({ src, alt, reverse }: { src: string; alt: string; reverse?: boolean }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltRef.current || !frameRef.current) return;
    const rect = tiltRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    tiltRef.current.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;

    // Spotlight position
    frameRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    frameRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!tiltRef.current) return;
    tiltRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)';
  }, []);

  return (
    <motion.div
      {...imageVariants(reverse)}
      className={`relative ${reverse ? 'lg:order-2' : 'lg:order-1'}`}
    >
      {/* Animated glow orb behind */}
      <div className="absolute -inset-8 rounded-3xl glow-card-bg opacity-50 feature-float" />

      <div
        className="perspective-1200"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={tiltRef}
          className="preserve-3d transition-transform duration-200 ease-out"
        >
          <div ref={frameRef} className="feature-frame spotlight-glow">
            {/* Animated border beam (via CSS ::before) */}
            <div className="feature-frame-inner">
              <img
                src={src}
                alt={alt}
                className="w-full h-auto object-cover"
                loading="lazy"
                decoding="async"
              />
              {/* Bottom fade blend */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/50 via-transparent to-[#020617]/10 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function FeaturesShowcaseSection() {
  return (
    <section className="py-28 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/[0.03] blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
            Plataforma completa
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
            Recursos que fazem a <span className="gradient-text">diferenca</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Tecnologia de ponta para voce se destacar no mundo digital
          </p>
        </motion.div>

        <div className="space-y-32 lg:space-y-40">
          {features.map((f, i) => (
            <div
              key={i}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center"
            >
              <FeatureImage src={f.image} alt={f.imageAlt} reverse={f.reverse} />

              {/* Text side */}
              <motion.div
                {...textVariants(f.reverse)}
                className={`${f.reverse ? 'lg:order-1 lg:text-right' : 'lg:order-2'}`}
              >
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-5">
                  {f.badge}
                </span>

                <h3 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                  {f.title}
                </h3>

                <p className="text-slate-400 leading-relaxed mb-8 max-w-md">{f.description}</p>

                <div className={`space-y-4 ${f.reverse ? 'lg:ml-auto lg:max-w-md' : 'max-w-md'}`}>
                  {f.bullets.map((b, j) => (
                    <motion.div
                      key={j}
                      {...bulletVariants}
                      transition={{
                        duration: 0.4,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.3 + j * 0.08,
                      }}
                      className={`flex items-center gap-3 group/bullet ${f.reverse ? 'lg:flex-row-reverse' : ''}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/[0.10] to-violet-600/[0.10] border border-indigo-500/[0.15] flex items-center justify-center shrink-0 group-hover/bullet:border-indigo-500/30 group-hover/bullet:shadow-lg group-hover/bullet:shadow-indigo-500/10 transition-all duration-300">
                        <b.icon size={18} className="text-indigo-400" />
                      </div>
                      <span className="text-sm text-slate-300 group-hover/bullet:text-white transition-colors duration-200">
                        {b.text}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
