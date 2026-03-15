import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, ChevronLeft, ChevronRight, Users, Calendar, MapPin, Tag, Loader2, TrendingUp,
} from 'lucide-react';
import { useWrappedStats } from '@/hooks/useConnections';
import { resolvePhotoUrl } from '@/lib/constants';

export default function WrappedTab() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data: stats, isLoading } = useWrappedStats(year);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Year selector */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setYear(year - 1)}
          className="p-1.5 rounded-full hover:bg-white/5 text-white/40"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-brand-cyan" />
          <span className="text-sm font-bold text-white tabular-nums">{year}</span>
        </div>
        <button
          type="button"
          onClick={() => setYear(year + 1)}
          disabled={year >= currentYear}
          className="p-1.5 rounded-full hover:bg-white/5 text-white/40 disabled:opacity-20"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {!stats || stats.totalConnections === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <Sparkles size={24} className="text-white/30" />
          </div>
          <p className="text-sm font-semibold text-white mb-1">Sem dados para {year}</p>
          <p className="text-xs text-white/40 max-w-xs mx-auto">
            Continue conectando com pessoas para ver seu resumo anual aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Total connections */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-brand-cyan/10 to-purple-500/10 border border-brand-cyan/20 text-center"
          >
            <Users size={20} className="mx-auto mb-2 text-brand-cyan" />
            <p className="text-3xl font-bold text-white">{stats.totalConnections}</p>
            <p className="text-xs text-white/50 mt-1">conexões em {year}</p>
          </motion.div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Top month */}
            {stats.topMonth && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <Calendar size={14} className="text-amber-400 mb-2" />
                <p className="text-lg font-bold text-white">{stats.topMonth.name}</p>
                <p className="text-[10px] text-white/40">Mes mais ativo ({stats.topMonth.count})</p>
              </motion.div>
            )}

            {/* First connection */}
            {stats.firstConnection && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <TrendingUp size={14} className="text-green-400 mb-2" />
                <div className="flex items-center gap-2">
                  {stats.firstConnection.profile.photoUrl && (
                    <img
                      src={resolvePhotoUrl(stats.firstConnection.profile.photoUrl)!}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                  <p className="text-sm font-semibold text-white truncate">
                    {stats.firstConnection.profile.displayName}
                  </p>
                </div>
                <p className="text-[10px] text-white/40 mt-1">Primeira conexão</p>
              </motion.div>
            )}

            {/* Top location */}
            {stats.topLocation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <MapPin size={14} className="text-blue-400 mb-2" />
                <p className="text-sm font-semibold text-white truncate">{stats.topLocation}</p>
                <p className="text-[10px] text-white/40">Local mais frequente</p>
              </motion.div>
            )}

            {/* Top tag */}
            {stats.topTag && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <Tag size={14} className="text-purple-400 mb-2" />
                <p className="text-sm font-semibold text-white truncate">{stats.topTag}</p>
                <p className="text-[10px] text-white/40">Tag mais usada</p>
              </motion.div>
            )}
          </div>

          {/* Monthly chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Conexões por mes</p>
            <div className="flex items-end gap-1 h-24">
              {stats.monthlyData.map((m, i) => {
                const maxCount = Math.max(...stats.monthlyData.map((d) => d.count), 1);
                const height = (m.count / maxCount) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${Math.max(height, 2)}%`,
                        background: m.count > 0
                          ? `linear-gradient(to top, rgba(0,228,242,0.3), rgba(0,228,242,0.8))`
                          : 'rgba(255,255,255,0.05)',
                      }}
                    />
                    <span className="text-[8px] text-white/30">{m.name.slice(0, 1)}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
