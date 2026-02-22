import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { CARD_TEMPLATES, type CardTemplate } from '@/lib/card-templates';

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (template: CardTemplate) => void;
}

export function TemplatePicker({ open, onClose, onApply }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-brand-bg-card border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-brand-cyan" />
                <h2 className="text-lg font-bold">Escolha um template</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-white/40 mb-5">
              Comece rapidamente com um template pre-pronto. Voce pode personalizar tudo depois.
            </p>

            <div className="space-y-3">
              {CARD_TEMPLATES.map((template) => (
                <button
                  type="button"
                  key={template.id}
                  onClick={() => { onApply(template); onClose(); }}
                  className="w-full text-left p-4 rounded-xl border border-white/10 hover:border-brand-cyan/30 hover:bg-white/[0.03] transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-brand-cyan transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-xs text-white/40 mt-0.5">{template.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border border-white/20"
                        style={{ backgroundColor: template.buttonColor }}
                      />
                      <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                        {template.suggestedLinks.length} links
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
