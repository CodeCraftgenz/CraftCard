import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Send, Clock } from 'lucide-react';
import { useAvailableTimes, useCreateBooking } from '@/hooks/useBookings';

interface BookingCalendarProps {
  slug: string;
  accent: string;
  onClose: () => void;
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function getNext14Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function BookingCalendar({ slug, accent, onClose }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', notes: '' });
  const [success, setSuccess] = useState(false);

  const dateStr = selectedDate ? formatDate(selectedDate) : null;
  const { data: times, isLoading: timesLoading } = useAvailableTimes(slug, dateStr);
  const createBooking = useCreateBooking();

  const days = getNext14Days();

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || form.name.length < 2 || !form.email.includes('@')) return;
    try {
      await createBooking.mutateAsync({
        slug,
        data: {
          name: form.name,
          email: form.email,
          date: formatDate(selectedDate),
          time: selectedTime,
          notes: form.notes || undefined,
        },
      });
      setSuccess(true);
    } catch {
      // handled by mutation state
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <Check size={40} className="mx-auto text-green-400 mb-3" />
        <p className="text-white font-semibold">Agendamento confirmado!</p>
        <p className="text-sm text-white/40 mt-1">
          {selectedDate && `${selectedDate.getDate()} de ${MONTH_NAMES[selectedDate.getMonth()]}`} as {selectedTime}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 text-sm text-brand-cyan hover:underline"
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Selection */}
      <div>
        <p className="text-xs text-white/50 mb-2 font-medium">Selecione uma data</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {days.map((day) => {
            const isSelected = selectedDate && formatDate(day) === formatDate(selectedDate);
            return (
              <button
                key={formatDate(day)}
                type="button"
                onClick={() => { setSelectedDate(day); setSelectedTime(null); }}
                className={`flex flex-col items-center min-w-[52px] px-2 py-2 rounded-xl border text-xs transition-all ${
                  isSelected
                    ? 'border-white/30 bg-white/10 text-white'
                    : 'border-white/10 text-white/50 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <span className="font-medium">{DAY_NAMES[day.getDay()]}</span>
                <span className="text-lg font-bold">{day.getDate()}</span>
                <span className="text-[10px] text-white/30">{MONTH_NAMES[day.getMonth()].slice(0, 3)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Selection */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="text-xs text-white/50 mb-2 font-medium flex items-center gap-1">
              <Clock size={12} />
              Horarios disponiveis
            </p>
            {timesLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            ) : times && times.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {times.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      selectedTime === time
                        ? 'border-white/30 bg-white/10 text-white'
                        : 'border-white/10 text-white/50 hover:border-white/20'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/30 text-center py-3">Nenhum horario disponivel nesta data</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Form */}
      <AnimatePresence>
        {selectedTime && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Seu nome *"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50 transition-all"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="Seu email *"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50 transition-all"
            />
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Observacoes (opcional)"
              rows={2}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50 transition-all resize-none"
            />
            {createBooking.isError && (
              <p className="text-xs text-red-400">Erro ao agendar. Tente novamente.</p>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={form.name.length < 2 || !form.email.includes('@') || createBooking.isPending}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: accent }}
            >
              <Send size={16} />
              {createBooking.isPending ? 'Agendando...' : 'Confirmar Agendamento'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
