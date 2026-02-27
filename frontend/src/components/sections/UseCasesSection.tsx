import { motion } from 'framer-motion';
import {
  User,
  Building2,
  QrCode,
  BarChart3,
  Calendar,
  Briefcase,
  Users,
  Palette,
  Mail,
  Shield,
} from 'lucide-react';

const useCases = [
  {
    icon: User,
    title: 'Profissionais e Freelancers',
    description:
      'Seu cartao digital como link na bio, QR code em eventos e portfolio online.',
    bullets: [
      { icon: QrCode, text: 'QR Code para eventos e networking' },
      { icon: Calendar, text: 'Receba agendamentos online' },
      { icon: Briefcase, text: 'Exiba seus servicos e portfolio' },
      { icon: BarChart3, text: 'Analytics de visitas e cliques' },
    ],
    accentFrom: 'from-blue-600/[0.12]',
    accentTo: 'to-indigo-600/[0.12]',
    accentBorder: 'border-blue-500/[0.15]',
    accentText: 'text-blue-400',
    accentBullet: 'text-blue-400/60',
    image: null as string | null,
  },
  {
    icon: Building2,
    title: 'Empresas e Equipes',
    description:
      'Cartoes padronizados para toda a equipe com gestao centralizada.',
    bullets: [
      { icon: Users, text: 'Cartoes padronizados para a equipe' },
      { icon: Palette, text: 'Branding centralizado (cores, logo, fonte)' },
      { icon: Mail, text: 'Dashboard com leads de todos os membros' },
      { icon: Shield, text: 'Controle visual e convites por email' },
    ],
    accentFrom: 'from-violet-600/[0.12]',
    accentTo: 'to-indigo-600/[0.12]',
    accentBorder: 'border-violet-500/[0.15]',
    accentText: 'text-violet-400',
    accentBullet: 'text-violet-400/60',
    image: '/feature-team-dashboard.jpg',
  },
];

export function UseCasesSection() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-violet/[0.01] to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
            Para quem <span className="gradient-text">e</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Seja voce um profissional independente ou uma empresa, o CraftCard
            se adapta a sua necessidade
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {useCases.map((uc, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                delay: i * 0.12,
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="glass-card-hover border-glow-hover p-0 overflow-hidden group"
            >
              {/* Full-bleed image header with glass overlay */}
              {uc.image && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={uc.image}
                    alt={uc.title}
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                  />
                  {/* Gradient fade into card body */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent" />

                  {/* Floating badge on image */}
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    Enterprise
                  </div>
                </div>
              )}

              <div className={`${uc.image ? 'p-6 sm:p-8 -mt-4 relative' : 'p-6 sm:p-8'}`}>
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 bg-gradient-to-br ${uc.accentFrom} ${uc.accentTo} ${uc.accentBorder} border`}
                >
                  <uc.icon size={26} className={uc.accentText} />
                </div>

                <h3 className="font-heading text-xl font-semibold mb-2 tracking-tight">
                  {uc.title}
                </h3>
                <p className="text-sm text-slate-500 mb-6">{uc.description}</p>

                <div className="space-y-3">
                  {uc.bullets.map((b, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <b.icon size={16} className={uc.accentBullet} />
                      <span className="text-sm text-slate-400">{b.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
