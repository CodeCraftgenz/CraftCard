import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Posso comecar gratis?',
    a: 'Sim! O plano Free permite criar 1 cartao digital com ate 5 links, 3 temas e publicar gratuitamente. Voce pode fazer upgrade para o Pro ou Business a qualquer momento.',
  },
  {
    q: 'Qual a diferenca entre os planos?',
    a: 'O plano Free e ideal para experimentar. O Pro (R$30/ano) libera todos os recursos: analytics, galeria, agendamentos, depoimentos, servicos, FAQ, customizacao visual completa e ate 5 cartoes. O Business (R$199/ano) e para empresas: ate 10 usuarios, dashboard centralizado, branding da empresa e webhooks.',
  },
  {
    q: 'Como funciona para empresas?',
    a: 'No plano Business, voce cria uma organizacao, convida membros por email e gerencia todos os cartoes de um so lugar. A empresa define cores, logo e fonte — os membros editam apenas o conteudo (nome, bio, links). O dashboard mostra analytics e leads consolidados de toda a equipe.',
  },
  {
    q: 'Posso comecar gratis e fazer upgrade depois?',
    a: 'Com certeza! Comece no plano Free e faca upgrade quando precisar de mais recursos. Seus dados e cartao sao mantidos ao trocar de plano.',
  },
  {
    q: 'Como funciona a assinatura Pro?',
    a: 'A assinatura Pro e anual por R$30 (preco promocional — valor original R$99,90). Voce tem acesso completo por 365 dias. Ao final do periodo, basta renovar para continuar com todos os recursos.',
  },
  {
    q: 'Quais formas de pagamento sao aceitas?',
    a: 'Aceitamos cartao de credito/debito, PIX e boleto. O pagamento e processado de forma segura pelo Mercado Pago.',
  },
  {
    q: 'Posso editar meu cartao depois de publicar?',
    a: 'Claro! Voce pode alterar foto, bio, redes sociais, cores e slug quantas vezes quiser, a qualquer momento.',
  },
  {
    q: 'O cartao funciona em qualquer dispositivo?',
    a: 'Sim! Seu cartao e totalmente responsivo e funciona perfeitamente em celulares, tablets e computadores.',
  },
  {
    q: 'Posso excluir minha conta?',
    a: 'Sim. Voce pode excluir sua conta e todos os seus dados a qualquer momento, em conformidade com a LGPD.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-sm font-medium pr-4">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-white/50 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  return (
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Perguntas <span className="gradient-text">frequentes</span>
          </h2>
        </div>

        <div className="glass-card p-6 sm:p-8">
          {faqs.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
