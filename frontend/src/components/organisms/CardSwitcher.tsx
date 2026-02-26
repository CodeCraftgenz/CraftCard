import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Star, Trash2, ChevronDown, Lock } from 'lucide-react';

interface Card {
  id: string;
  label: string;
  slug: string;
  isPrimary: boolean;
  displayName: string;
}

interface CardSwitcherProps {
  cards: Card[];
  activeCardId: string | undefined;
  onSwitch: (cardId: string) => void;
  onCreate: (label: string) => void;
  onDelete: (cardId: string) => void;
  onSetPrimary: (cardId: string) => void;
  hasPaid: boolean;
  maxCards?: number;
}

export function CardSwitcher({
  cards,
  activeCardId,
  onSwitch,
  onCreate,
  onDelete,
  onSetPrimary,
  hasPaid,
  maxCards = 1,
}: CardSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeCard = cards.find((c) => c.id === activeCardId) || cards.find((c) => c.isPrimary) || cards[0];

  if (!hasPaid || cards.length === 0) {
    return null;
  }

  return (
    <div className="relative mb-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass-card p-4 flex items-center justify-between hover:border-white/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center">
            {activeCard?.isPrimary && <Star size={14} className="text-yellow-400 fill-yellow-400" />}
            {!activeCard?.isPrimary && <span className="text-xs text-white/60 font-bold">{cards.indexOf(activeCard!) + 1}</span>}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">{activeCard?.label || 'Principal'}</p>
            <p className="text-xs text-white/40">{activeCard?.slug ? `/${activeCard.slug}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${cards.length >= maxCards ? 'text-yellow-400/70' : 'text-white/30'}`}>
            {cards.length}/{maxCards} {cards.length >= maxCards ? '(limite)' : ''}
          </span>
          <ChevronDown size={16} className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 glass-card p-2 space-y-1"
          >
            {cards.map((card) => (
              <div
                key={card.id}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  card.id === activeCardId ? 'bg-brand-cyan/10 border border-brand-cyan/20' : 'hover:bg-white/5'
                }`}
                onClick={() => { onSwitch(card.id); setIsOpen(false); }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {card.isPrimary && <Star size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />}
                  <span className="text-sm font-medium truncate">{card.label}</span>
                  <span className="text-xs text-white/30 truncate">/{card.slug}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!card.isPrimary && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onSetPrimary(card.id); }}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        title="Definir como principal"
                      >
                        <Star size={12} className="text-white/40" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                        title="Excluir cartao"
                      >
                        <Trash2 size={12} className="text-white/40 hover:text-red-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {cards.length < maxCards ? (
              <button
                type="button"
                onClick={() => {
                  onCreate('Novo Cartao');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 p-3 rounded-xl text-sm text-brand-cyan hover:bg-brand-cyan/5 transition-colors"
              >
                <Plus size={14} />
                Novo Cartao
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2 text-sm text-white/30">
                  <Lock size={14} />
                  <span>Limite de {maxCards} {maxCards === 1 ? 'cartao' : 'cartoes'} atingido</span>
                </div>
                {maxCards < 3 && (
                  <p className="text-xs text-brand-cyan/60 mt-1 ml-6">
                    Faca upgrade para o Pro e tenha ate 3 cartoes
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
