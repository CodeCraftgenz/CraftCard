import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  UserPlus, CreditCard, Users, Instagram, Linkedin, MessageCircle,
  Globe, Mail, MapPin, Music, Play, ArrowRight, Sparkles, Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

/* ─── Demo profile data ─── */
const DEMO_PROFILE = {
  name: 'Lucas Ferreira',
  role: 'Product Designer',
  company: 'CraftCard',
  bio: 'Designer de produto & consultor de branding.\nCriando experiencias digitais memoraveis.',
  avatar: '/demo-avatar.svg', // fallback to initials
};

const DEMO_LINKS = [
  { icon: Instagram, label: 'Instagram', color: '#E4405F', bg: 'from-pink-500/20 to-purple-500/20' },
  { icon: Linkedin, label: 'LinkedIn', color: '#0A66C2', bg: 'from-blue-500/20 to-cyan-500/20' },
  { icon: MessageCircle, label: 'WhatsApp', color: '#25D366', bg: 'from-green-500/20 to-emerald-500/20' },
  { icon: Globe, label: 'Portfolio', color: '#8B5CF6', bg: 'from-violet-500/20 to-indigo-500/20' },
  { icon: Mail, label: 'Email', color: '#EA4335', bg: 'from-red-500/20 to-orange-500/20' },
  { icon: Music, label: 'Spotify', color: '#1DB954', bg: 'from-green-400/20 to-green-600/20' },
  { icon: MapPin, label: 'Localização', color: '#F59E0B', bg: 'from-amber-500/20 to-yellow-500/20' },
  { icon: Play, label: 'YouTube', color: '#FF0000', bg: 'from-red-500/20 to-red-600/20' },
];

const ACTION_PILLS = [
  { icon: UserPlus, label: 'Salvar contato', delay: 0.3 },
  { icon: CreditCard, label: 'Cartão Virtual', delay: 0.4 },
  { icon: Users, label: 'Perfis conectados', delay: 0.5 },
];

const CONNECTED_PROFILES = [
  { name: 'Ana', color: '#00E4F2' },
  { name: 'Pedro', color: '#8B5CF6' },
  { name: 'Julia', color: '#F59E0B' },
  { name: 'Carlos', color: '#E4405F' },
  { name: 'Bia', color: '#1DB954' },
];

/* ─── Animations ─── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
});

/* ─── Phone Mockup Content (auto-scrolls) ─── */
function PhoneContent() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let frame: number;
    let direction = 1;
    const speed = 0.3;

    const animate = () => {
      setScrollY(prev => {
        const maxScroll = el.scrollHeight - el.clientHeight;
        let next = prev + speed * direction;
        if (next >= maxScroll) { direction = -1; next = maxScroll; }
        if (next <= 0) { direction = 1; next = 0; }
        return next;
      });
      frame = requestAnimationFrame(animate);
    };

    const timeout = setTimeout(() => {
      frame = requestAnimationFrame(animate);
    }, 2000);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollY;
    }
  }, [scrollY]);

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-hidden"
      style={{ scrollBehavior: 'auto' }}
    >
      <div className="p-4 pb-8">
        {/* Cover gradient */}
        <div className="h-24 rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden mb-[-2rem]">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-40" />
        </div>

        {/* Avatar */}
        <div className="flex justify-center relative z-10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg ring-3 ring-[#0f172a] shadow-lg">
            LF
          </div>
        </div>

        {/* Name & Bio */}
        <div className="text-center mt-2">
          <div className="flex items-center justify-center gap-1.5">
            <h3 className="text-sm font-bold text-white">{DEMO_PROFILE.name}</h3>
            <Star size={12} className="text-amber-400 fill-amber-400" />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">{DEMO_PROFILE.role} @ {DEMO_PROFILE.company}</p>
          <p className="text-[9px] text-slate-500 mt-1.5 leading-relaxed whitespace-pre-line px-2">
            {DEMO_PROFILE.bio}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3 px-1">
          <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 text-[9px] font-semibold text-white">
            <UserPlus size={10} /> Salvar
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-white/10 text-[9px] font-medium text-slate-300">
            <Users size={10} /> Conectar
          </button>
        </div>

        {/* Social links grid */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {DEMO_LINKS.map((link, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-br ${link.bg} border border-white/5 hover:border-white/10 transition-colors`}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${link.color}20` }}
              >
                <link.icon size={13} style={{ color: link.color }} />
              </div>
              <span className="text-[10px] font-medium text-slate-200 truncate">{link.label}</span>
            </div>
          ))}
        </div>

        {/* Connected profiles */}
        <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Conexões</p>
          <div className="flex -space-x-2">
            {CONNECTED_PROFILES.map((p, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-bold text-white ring-2 ring-[#0f172a]"
                style={{ backgroundColor: p.color }}
              >
                {p.name[0]}
              </div>
            ))}
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-slate-400 ring-2 ring-[#0f172a]">
              +12
            </div>
          </div>
        </div>

        {/* Mini map */}
        <div className="mt-3 h-24 rounded-xl overflow-hidden border border-white/5 relative">
          <iframe
            src="https://www.google.com/maps?q=Sao+Paulo,SP,Brasil&output=embed"
            className="w-full h-full border-0 pointer-events-none"
            loading="lazy"
            title="Localização"
          />
          <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-[#0f172a] to-transparent" />
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm">
            <span className="text-[7px] text-white/80 font-medium">Sao Paulo, SP</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Phone Frame (CSS) ─── */
function PhoneMockup() {
  return (
    <div className="relative">
      {/* Glow behind phone */}
      <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-indigo-600/20 via-violet-600/10 to-cyan-500/15 blur-3xl" />

      {/* Phone frame */}
      <div className="relative w-[260px] h-[530px] rounded-[2.5rem] bg-gradient-to-b from-slate-700 to-slate-800 p-[3px] shadow-2xl shadow-indigo-500/20">
        <div className="w-full h-full rounded-[2.3rem] bg-[#0f172a] overflow-hidden relative">
          {/* Status bar */}
          <div className="absolute top-0 inset-x-0 z-20 h-7 bg-[#0f172a] flex items-center justify-between px-5">
            <span className="text-[9px] text-white/70 font-medium">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-2 border border-white/50 rounded-sm relative">
                <div className="absolute inset-[1px] right-[2px] bg-green-400 rounded-[1px]" />
              </div>
            </div>
          </div>

          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-[90px] h-[22px] bg-black rounded-b-2xl" />

          {/* Content */}
          <div className="mt-7 h-[calc(100%-28px)]">
            <PhoneContent />
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/20 rounded-full" />
        </div>
      </div>

      {/* Floating badges around phone */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-12 top-16 px-3 py-1.5 rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 shadow-lg"
      >
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
            <MessageCircle size={10} className="text-green-400" />
          </div>
          <span className="text-[10px] font-medium text-white/80">WhatsApp</span>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -left-10 top-40 px-3 py-1.5 rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 shadow-lg"
      >
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-pink-500/20 flex items-center justify-center">
            <Instagram size={10} className="text-pink-400" />
          </div>
          <span className="text-[10px] font-medium text-white/80">Instagram</span>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -right-8 bottom-28 px-3 py-1.5 rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 shadow-lg"
      >
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Linkedin size={10} className="text-blue-400" />
          </div>
          <span className="text-[10px] font-medium text-white/80">LinkedIn</span>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Section ─── */
export function DemoShowcaseSection() {
  const { isAuthenticated } = useAuth();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section ref={sectionRef} className="py-24 md:py-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-600/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.03] blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text content */}
          <div>
            <motion.span
              {...fadeUp(0)}
              className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-6"
            >
              Veja na prática
            </motion.span>

            <motion.h2
              {...fadeUp(0.1)}
              className="font-heading text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-tight"
            >
              Seu cartão digital,{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                sempre no bolso
              </span>
            </motion.h2>

            <motion.p
              {...fadeUp(0.2)}
              className="mt-5 text-slate-400 leading-relaxed max-w-md"
            >
              Compartilhe seu perfil profissional com um único link ou QR Code.
              Todos os seus contatos, redes sociais e informações reunidos em um
              cartão elegante e interativo.
            </motion.p>

            {/* Action pills */}
            <div className="mt-8 flex flex-col gap-3">
              {ACTION_PILLS.map((pill, i) => (
                <motion.div
                  key={i}
                  {...fadeUp(pill.delay)}
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300 w-fit group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center group-hover:border-indigo-500/40 transition-colors">
                    <pill.icon size={15} className="text-indigo-400" />
                  </div>
                  <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">
                    {pill.label}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div {...fadeUp(0.6)} className="mt-10">
              <Link
                to={isAuthenticated ? '/editor' : '/register'}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-bg text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-indigo-500/20"
              >
                <Sparkles size={16} className="opacity-70" />
                Criar meu cartão gratis
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* Right: Phone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="flex justify-center lg:justify-end"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
