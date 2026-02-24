import { motion } from 'framer-motion';
import { User, Building2, QrCode, BarChart3, Calendar, Briefcase, Users, Palette, Mail, Shield } from 'lucide-react';

const useCases = [
  {
    icon: User,
    title: 'Profissionais e Freelancers',
    description: 'Seu cartao digital como link na bio, QR code em eventos e portfolio online.',
    bullets: [
      { icon: QrCode, text: 'QR Code para eventos e networking' },
      { icon: Calendar, text: 'Receba agendamentos online' },
      { icon: Briefcase, text: 'Exiba seus servicos e portfolio' },
      { icon: BarChart3, text: 'Analytics de visitas e cliques' },
    ],
    accent: 'brand-cyan',
  },
  {
    icon: Building2,
    title: 'Empresas e Equipes',
    description: 'Cartoes padronizados para toda a equipe com gestao centralizada.',
    bullets: [
      { icon: Users, text: 'Cartoes padronizados para a equipe' },
      { icon: Palette, text: 'Branding centralizado (cores, logo, fonte)' },
      { icon: Mail, text: 'Dashboard com leads de todos os membros' },
      { icon: Shield, text: 'Controle visual e convites por email' },
    ],
    accent: 'brand-magenta',
  },
];

export function UseCasesSection() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-magenta/[0.02] to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Para quem <span className="gradient-text">e</span>
          </h2>
          <p className="mt-4 text-white/50 max-w-2xl mx-auto">
            Seja voce um profissional independente ou uma empresa, o CraftCard se adapta a sua necessidade
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {useCases.map((uc, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card p-6 sm:p-8"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 ${i === 0 ? 'bg-brand-cyan/10' : 'bg-brand-magenta/10'}`}>
                <uc.icon size={26} className={i === 0 ? 'text-brand-cyan' : 'text-brand-magenta'} />
              </div>

              <h3 className="text-xl font-semibold mb-2">{uc.title}</h3>
              <p className="text-sm text-white/50 mb-6">{uc.description}</p>

              <div className="space-y-3">
                {uc.bullets.map((b, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <b.icon size={16} className={i === 0 ? 'text-brand-cyan/70' : 'text-brand-magenta/70'} />
                    <span className="text-sm text-white/70">{b.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
