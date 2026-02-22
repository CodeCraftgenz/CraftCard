import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

const features = [
  'Cartao digital personalizado',
  'Link publico exclusivo',
  'Foto, bio e redes sociais',
  'Botao de WhatsApp',
  'Upload de curriculo',
  'QR Code do seu cartao',
  'Salvar Contato (vCard)',
  '10 temas visuais',
  'Foto de capa personalizada',
  'Links personalizados (link-in-bio)',
  'Analytics de visualizacoes e cliques',
  'Formulario de contato integrado',
  'Compartilhamento inteligente',
  'Status de disponibilidade',
];

export function PricingSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section id="preco" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Preco <span className="gradient-text">simples</span>
          </h2>
          <p className="mt-4 text-white/50 max-w-2xl mx-auto">
            Um investimento acessivel para um ano inteiro de presenca digital
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto"
        >
          <div className="glass-card p-8 relative overflow-hidden">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 gradient-bg" />

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-3">
                <p className="text-sm text-brand-cyan font-semibold uppercase tracking-wider">
                  Assinatura anual
                </p>
                <span className="text-xs font-bold bg-gradient-to-r from-brand-cyan to-brand-magenta text-white px-2.5 py-0.5 rounded-full">
                  70% OFF
                </span>
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-lg text-white/30 line-through">R$99,90</span>
                <span className="text-sm text-white/50">R$</span>
                <span className="text-6xl font-extrabold gradient-text">30</span>
                <span className="text-sm text-white/40">/ano</span>
              </div>
              <p className="text-sm text-white/40 mt-2">Menos de R$2,50 por mes. Cancele quando quiser.</p>
            </div>

            <div className="space-y-3 mb-8">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check size={16} className="text-brand-cyan shrink-0" />
                  <span className="text-sm text-white/70">{f}</span>
                </div>
              ))}
            </div>

            <Link
              to={isAuthenticated ? '/editor' : '/login'}
              className="group w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl gradient-bg text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-brand-cyan/20"
            >
              Criar meu cartao
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
