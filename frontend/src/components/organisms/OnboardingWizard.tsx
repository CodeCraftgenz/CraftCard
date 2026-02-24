import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check, User, FileText, Link2, Palette, Sparkles } from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
}

export interface OnboardingData {
  displayName: string;
  bio: string;
  links: Array<{ platform: string; url: string }>;
}

const QUICK_LINKS = [
  { platform: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/5511...' },
  { platform: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { platform: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' },
];

const STEPS = [
  { icon: User, title: 'Seu nome', subtitle: 'Como voce quer ser conhecido' },
  { icon: FileText, title: 'Sobre voce', subtitle: 'Uma bio curta sobre o que voce faz' },
  { icon: Link2, title: 'Seus links', subtitle: 'Adicione seus principais contatos' },
  { icon: Sparkles, title: 'Pronto!', subtitle: 'Seu cartao esta quase la' },
];

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [links, setLinks] = useState<Record<string, string>>({});

  const canProceed = () => {
    if (step === 0) return displayName.trim().length >= 2;
    return true;
  };

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      const validLinks = Object.entries(links)
        .filter(([, url]) => url.trim())
        .map(([platform, url]) => ({ platform, url: url.trim() }));
      onComplete({ displayName: displayName.trim(), bio: bio.trim(), links: validLinks });
    }
  }, [step, displayName, bio, links, onComplete]);

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const StepIcon = STEPS[step].icon;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-[#1A1A2E] border border-white/10 rounded-2xl overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-1 bg-white/5">
          <motion.div
            className="h-full gradient-bg"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Header */}
        <div className="p-6 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <StepIcon size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{STEPS[step].title}</h3>
              <p className="text-xs text-white/40">{STEPS[step].subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="text-white/30 hover:text-white/60 transition-colors"
            title="Pular"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[200px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <input
                  type="text"
                  placeholder="Seu nome completo ou profissional"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-brand-cyan/50 focus:outline-none text-lg"
                  maxLength={60}
                  autoFocus
                />
              )}

              {step === 1 && (
                <div className="space-y-3">
                  <textarea
                    placeholder="Ex: Designer grafico com 5 anos de experiencia em branding e identidade visual."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-brand-cyan/50 focus:outline-none resize-none"
                    rows={4}
                    maxLength={300}
                  />
                  <p className="text-[10px] text-white/30 text-right">{bio.length}/300</p>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  {QUICK_LINKS.map((ql) => (
                    <div key={ql.platform} className="space-y-1">
                      <label className="text-xs text-white/50">{ql.label}</label>
                      <input
                        type="url"
                        placeholder={ql.placeholder}
                        value={links[ql.platform] || ''}
                        onChange={(e) => setLinks((prev) => ({ ...prev, [ql.platform]: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 focus:border-brand-cyan/50 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full gradient-bg mx-auto mb-4 flex items-center justify-center">
                    <Check size={32} className="text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Tudo pronto!</h4>
                  <p className="text-sm text-white/50">
                    Seu cartao digital esta configurado. Voce pode personalizar mais detalhes no editor.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex items-center justify-between">
          <button
            type="button"
            onClick={step === 0 ? onSkip : handleBack}
            className="flex items-center gap-1 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            {step === 0 ? (
              'Pular'
            ) : (
              <>
                <ArrowLeft size={14} />
                Voltar
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-bg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {step === STEPS.length - 1 ? 'Comecar' : 'Proximo'}
            {step < STEPS.length - 1 && <ArrowRight size={14} />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
