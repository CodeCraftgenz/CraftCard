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
  '4 temas visuais',
  'Contador de visualizacoes',
  'SEO basico para compartilhamento',
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
              <p className="text-sm text-brand-cyan font-semibold uppercase tracking-wider mb-2">
                Assinatura anual
              </p>
              <div className="flex items-baseline justify-center gap-1">
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
