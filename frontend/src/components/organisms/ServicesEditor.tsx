import { useState } from 'react';
import { Plus, X, Briefcase } from 'lucide-react';
import { useServices, useCreateService, useUpdateService, useDeleteService } from '@/hooks/useServices';

export function ServicesEditor() {
  const { data: services } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = () => {
    if (newTitle.trim().length < 2) return;
    createService.mutate({ title: newTitle.trim() });
    setNewTitle('');
  };

  return (
    <div className="glass-card p-6 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Briefcase size={16} className="text-amber-400" />
        </div>
        <h3 className="font-semibold">Servicos</h3>
        <span className="text-xs text-white/30 ml-auto">{services?.length || 0}/20</span>
      </div>

      {services && services.length > 0 && (
        <div className="space-y-2 mb-4">
          {services.map((s) => (
            <div key={s.id} className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  defaultValue={s.title}
                  onBlur={(e) => {
                    if (e.target.value !== s.title) updateService.mutate({ id: s.id, title: e.target.value });
                  }}
                  className="w-full bg-transparent text-sm text-white font-medium focus:outline-none"
                  placeholder="Titulo do servico"
                />
                <input
                  type="text"
                  defaultValue={s.description || ''}
                  onBlur={(e) => updateService.mutate({ id: s.id, description: e.target.value })}
                  className="w-full bg-transparent text-xs text-white/50 focus:outline-none"
                  placeholder="Descricao (opcional)"
                />
                <input
                  type="text"
                  defaultValue={s.price || ''}
                  onBlur={(e) => updateService.mutate({ id: s.id, price: e.target.value })}
                  className="w-full bg-transparent text-xs text-brand-cyan focus:outline-none"
                  placeholder="Preco (ex: R$150)"
                />
              </div>
              <button
                type="button"
                onClick={() => deleteService.mutate(s.id)}
                className="p-1 text-white/20 hover:text-red-400 transition-colors shrink-0"
                title="Remover"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Nome do servico"
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50 transition-all"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={(services?.length || 0) >= 20 || createService.isPending}
          className="px-4 py-2.5 rounded-xl bg-brand-cyan/10 text-brand-cyan text-sm font-medium hover:bg-brand-cyan/20 transition-all disabled:opacity-30"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
