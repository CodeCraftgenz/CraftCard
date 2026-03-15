import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, MapPin, Calendar, Tag, Trash2, ExternalLink, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useTimeline, useRemoveConnection } from '@/hooks/useConnections';
import { useMyTags, useAssignTag, useRemoveTag, type Tag as TagType } from '@/hooks/useTags';
import { resolvePhotoUrl } from '@/lib/constants';

export default function TimelineTab() {
  const [page, setPage] = useState(1);
  const [filterTagId, setFilterTagId] = useState<string | undefined>();
  const { data: timeline, isLoading } = useTimeline(page, filterTagId);
  const { data: allTags = [] } = useMyTags();
  const removeMutation = useRemoveConnection();
  const assignTag = useAssignTag();
  const removeTag = useRemoveTag();
  const [tagMenuId, setTagMenuId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    );
  }

  if (!timeline || timeline.items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
          <Clock size={24} className="text-white/30" />
        </div>
        <p className="text-sm font-semibold text-white mb-1">Nenhuma conexão ainda</p>
        <p className="text-xs text-white/40 max-w-xs mx-auto">
          Quando você se conectar com outras pessoas, o histórico aparecerá aqui.
        </p>
      </div>
    );
  }

  // Group by date
  const grouped = new Map<string, typeof timeline.items>();
  for (const item of timeline.items) {
    const date = item.connectedAt
      ? new Date(item.connectedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Sem data';
    const arr = grouped.get(date) || [];
    arr.push(item);
    grouped.set(date, arr);
  }

  return (
    <div className="space-y-4">
      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterTagId(undefined)}
            className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
              !filterTagId ? 'border-brand-cyan bg-brand-cyan/10 text-brand-cyan' : 'border-white/10 text-white/40 hover:text-white/60'
            }`}
          >
            Todas
          </button>
          {allTags.map((tag: TagType) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => setFilterTagId(filterTagId === tag.id ? undefined : tag.id)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                filterTagId === tag.id ? 'border-brand-cyan bg-brand-cyan/10 text-brand-cyan' : 'border-white/10 text-white/40 hover:text-white/60'
              }`}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: tag.color || '#888' }} />
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-[52px] top-4 bottom-4 w-px bg-white/10" />

        {[...grouped.entries()].map(([date, items]) => (
          <div key={date} className="relative">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative flex items-stretch gap-0 mb-4"
              >
                {/* Date column */}
                <div className="w-[44px] shrink-0 flex flex-col items-end pt-5 pr-0">
                  {i === 0 && (
                    <span className="text-xs text-white/40 leading-tight text-right">
                      <span className="text-sm font-semibold text-white/60">
                        {new Date(item.connectedAt || item.createdAt).getDate()}
                      </span>
                      <br />
                      <span className="text-[10px] text-white/30">
                        {new Date(item.connectedAt || item.createdAt).toLocaleDateString('pt-BR', { month: 'short' })}
                      </span>
                    </span>
                  )}
                </div>

                {/* Dot */}
                <div className="w-5 shrink-0 flex justify-center pt-6">
                  <div className="w-2.5 h-2.5 rounded-full bg-dark-card border-2 border-brand-cyan/40 z-10" />
                </div>

                {/* Card */}
                <div className="flex-1 min-w-0 group">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all relative">
                    <span className="absolute top-2 right-2 text-[10px] text-white/30 tabular-nums">
                      {new Date(item.connectedAt || item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-start gap-3">
                      <a href={`/${item.profile.slug}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                          {item.profile.photoUrl ? (
                            <img src={resolvePhotoUrl(item.profile.photoUrl)!} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/30 text-sm font-bold">
                              {item.profile.displayName.charAt(0)}
                            </div>
                          )}
                        </div>
                      </a>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <a href={`/${item.profile.slug}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            <span className="text-sm font-semibold text-white truncate block">{item.profile.displayName}</span>
                          </a>
                          <ExternalLink size={10} className="text-white/20 shrink-0" />
                        </div>
                        <p className="text-[11px] text-white/40">@{item.profile.slug}</p>

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                          {item.locationLabel && (
                            <span className="flex items-center gap-1 text-[10px] text-white/40">
                              <MapPin size={10} /> {item.locationLabel}
                            </span>
                          )}
                          {item.event && (
                            <span className="flex items-center gap-1 text-[10px] text-white/40">
                              <Calendar size={10} /> {item.event.name}
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-1 mt-2">
                          {item.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full border border-white/10 text-white/50"
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color || '#888' }} />
                              {tag.name}
                              <button
                                type="button"
                                onClick={() => removeTag.mutate({ connectionId: item.id, tagId: tag.id })}
                                className="ml-0.5 text-white/20 hover:text-red-400 transition"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => setTagMenuId(tagMenuId === item.id ? null : item.id)}
                            className="flex items-center gap-0.5 text-[9px] text-white/20 hover:text-white/50 transition px-1.5 py-0.5 rounded-full border border-dashed border-white/10 hover:border-white/20"
                          >
                            <Tag size={8} /> tag
                          </button>
                        </div>

                        {/* Tag assign dropdown */}
                        {tagMenuId === item.id && allTags.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {allTags
                              .filter((t: TagType) => !item.tags.some((it) => it.id === t.id))
                              .map((t: TagType) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => { assignTag.mutate({ connectionId: item.id, tagId: t.id }); setTagMenuId(null); }}
                                  className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 transition"
                                >
                                  {t.name}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => { if (confirm('Remover conexão?')) removeMutation.mutate(item.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 p-1.5 rounded-full hover:bg-red-500/10"
                      >
                        <Trash2 size={12} className="text-red-400/50" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {timeline.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 disabled:opacity-20"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-white/40 tabular-nums">{page} / {timeline.totalPages}</span>
          <button
            type="button"
            disabled={page >= timeline.totalPages}
            onClick={() => setPage(page + 1)}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 disabled:opacity-20"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
