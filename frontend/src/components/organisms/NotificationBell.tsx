import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, MessageSquare, Calendar, Star } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications';

const typeIcons: Record<string, typeof MessageSquare> = {
  new_message: MessageSquare,
  new_booking: Calendar,
  new_testimonial: Star,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();
  const { data } = useNotifications(isAuthenticated);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-white/5 transition-colors"
        aria-label="Notificacoes"
      >
        <Bell size={18} className="text-white/70" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 mt-2 w-80 max-h-96 rounded-xl bg-brand-bg-card border border-white/10 shadow-xl overflow-hidden z-50"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <p className="text-sm font-medium text-white">Notificacoes</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="text-xs text-brand-cyan hover:text-brand-cyan/80 transition-colors"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[320px]">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-white/30 text-sm">
                Nenhuma notificacao
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = typeIcons[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      if (!n.isRead) markRead.mutate(n.id);
                    }}
                    className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0 ${
                      !n.isRead ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      !n.isRead ? 'bg-brand-cyan/10' : 'bg-white/5'
                    }`}>
                      <Icon size={14} className={!n.isRead ? 'text-brand-cyan' : 'text-white/30'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-medium truncate ${!n.isRead ? 'text-white' : 'text-white/50'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-white/30 shrink-0">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-white/40 truncate mt-0.5">{n.message}</p>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full bg-brand-cyan shrink-0 mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
