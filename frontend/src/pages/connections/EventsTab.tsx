import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Plus, MapPin, Users, Loader2, X, Crown,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useMyEvents, useCreateEvent, useDeleteEvent, type EventSummary } from '@/hooks/useEvents';
import { useAuth } from '@/providers/AuthProvider';

export default function EventsTab() {
  const { hasPaid } = useAuth();
  const { data: events = [], isLoading } = useMyEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const [showCreate, setShowCreate] = useState(false);
  const [showQr, setShowQr] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '', location: '' });

  const canCreate = hasPaid; // FREE = 0 events

  const handleCreate = () => {
    if (!form.name.trim() || !form.startDate) return;
    createEvent.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      location: form.location.trim() || undefined,
    }, {
      onSuccess: () => {
        setShowCreate(false);
        setForm({ name: '', description: '', startDate: '', endDate: '', location: '' });
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Meus eventos</span>
        {canCreate ? (
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 hover:bg-white/5 text-white/60 transition"
          >
            <Plus size={12} /> Novo evento
          </button>
        ) : (
          <button
            type="button"
            onClick={() => window.location.href = '/billing'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/10 border border-purple-500/20 text-purple-400 transition hover:bg-purple-500/20"
          >
            <Crown size={12} /> Upgrade para criar
          </button>
        )}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Novo evento</span>
                <button type="button" onClick={() => setShowCreate(false)} className="text-white/30 hover:text-white/60" title="Fechar"><X size={14} /></button>
              </div>
              <input
                type="text"
                placeholder="Nome do evento"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
              <input
                type="text"
                placeholder="Descricao (opcional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  title="Data de início"
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30"
                />
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  placeholder="Fim (opcional)"
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
              <input
                type="text"
                placeholder="Local (opcional)"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={!form.name.trim() || !form.startDate || createEvent.isPending}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-cyan/80 hover:bg-brand-cyan transition disabled:opacity-30"
              >
                {createEvent.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Criar evento'}
              </button>
              {createEvent.isError && (
                <p className="text-red-400 text-xs">{(createEvent.error as Error)?.message || 'Erro ao criar'}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-white/30" /></div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <CalendarDays size={24} className="text-white/30" />
          </div>
          <p className="text-sm font-semibold text-white mb-1">Nenhum evento</p>
          <p className="text-xs text-white/40 max-w-xs mx-auto">
            Crie eventos para agrupar conexões por contexto, conferência ou encontro.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((evt: EventSummary) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">{evt.name}</h4>
                  {evt.description && (
                    <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{evt.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    <span className="flex items-center gap-1 text-[11px] text-white/40">
                      <CalendarDays size={10} />
                      {new Date(evt.startDate).toLocaleDateString('pt-BR')}
                      {evt.endDate && ` - ${new Date(evt.endDate).toLocaleDateString('pt-BR')}`}
                    </span>
                    {evt.location && (
                      <span className="flex items-center gap-1 text-[11px] text-white/40">
                        <MapPin size={10} /> {evt.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-white/40">
                      <Users size={10} /> {evt.connectionCount} conexões
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowQr(showQr === evt.id ? null : evt.id)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition text-xs"
                  >
                    QR
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (confirm('Deletar evento?')) deleteEvent.mutate(evt.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-red-400/50 transition"
                    title="Deletar evento"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* QR Code */}
              {showQr === evt.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-3 flex flex-col items-center gap-2"
                >
                  <div className="p-3 bg-white rounded-xl">
                    <QRCodeCanvas
                      value={`${window.location.origin}/events/${evt.slug}`}
                      size={150}
                      level="H"
                      fgColor="#1a1a2e"
                    />
                  </div>
                  <p className="text-[10px] text-white/20">Escaneie para ver o evento</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
