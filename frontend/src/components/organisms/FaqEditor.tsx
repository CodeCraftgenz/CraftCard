import { useState } from 'react';
import { Plus, X, HelpCircle } from 'lucide-react';
import { useFaq, useCreateFaq, useUpdateFaq, useDeleteFaq } from '@/hooks/useFaq';

export function FaqEditor() {
  const { data: faqItems } = useFaq();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');

  const handleAdd = () => {
    if (newQ.trim().length < 3 || newA.trim().length < 3) return;
    createFaq.mutate({ question: newQ.trim(), answer: newA.trim() });
    setNewQ('');
    setNewA('');
  };

  return (
    <div className="glass-card p-6 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
          <HelpCircle size={16} className="text-indigo-400" />
        </div>
        <h3 className="font-semibold">Perguntas Frequentes</h3>
        <span className="text-xs text-white/30 ml-auto">{faqItems?.length || 0}/15</span>
      </div>

      {faqItems && faqItems.length > 0 && (
        <div className="space-y-2 mb-4">
          {faqItems.map((item) => (
            <div key={item.id} className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  defaultValue={item.question}
                  onBlur={(e) => {
                    if (e.target.value !== item.question) updateFaq.mutate({ id: item.id, question: e.target.value });
                  }}
                  className="w-full bg-transparent text-sm text-white font-medium focus:outline-none"
                  placeholder="Pergunta"
                />
                <textarea
                  defaultValue={item.answer}
                  onBlur={(e) => {
                    if (e.target.value !== item.answer) updateFaq.mutate({ id: item.id, answer: e.target.value });
                  }}
                  className="w-full bg-transparent text-xs text-white/50 focus:outline-none resize-none"
                  placeholder="Resposta"
                  rows={2}
                />
              </div>
              <button
                type="button"
                onClick={() => deleteFaq.mutate(item.id)}
                className="p-1 text-white/20 hover:text-red-400 transition-colors shrink-0"
                title="Remover"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <input
          type="text"
          value={newQ}
          onChange={(e) => setNewQ(e.target.value)}
          placeholder="Nova pergunta"
          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50 transition-all"
        />
        <div className="flex gap-2">
          <textarea
            value={newA}
            onChange={(e) => setNewA(e.target.value)}
            placeholder="Resposta"
            rows={2}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50 transition-all resize-none"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={(faqItems?.length || 0) >= 15 || createFaq.isPending}
            className="px-4 py-2.5 rounded-xl bg-brand-cyan/10 text-brand-cyan text-sm font-medium hover:bg-brand-cyan/20 transition-all disabled:opacity-30 self-end"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
