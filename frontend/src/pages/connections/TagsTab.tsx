import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tag, Plus, Loader2, Trash2 } from 'lucide-react';
import { useMyTags, useCreateTag, useDeleteTag, type Tag as TagType } from '@/hooks/useTags';

const PRESET_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];

export default function TagsTab() {
  const { data: tags = [], isLoading } = useMyTags();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createTag.mutate({ name: newName.trim(), color: newColor }, {
      onSuccess: () => setNewName(''),
    });
  };

  return (
    <div className="space-y-4">
      {/* Create tag */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Nova tag</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nome da tag"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={50}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={!newName.trim() || createTag.isPending}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-cyan/80 hover:bg-brand-cyan transition disabled:opacity-30"
          >
            {createTag.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          </button>
        </div>
        {/* Color picker */}
        <div className="flex gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setNewColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition ${newColor === c ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        {createTag.isError && (
          <p className="text-red-400 text-xs">{(createTag.error as Error)?.message || 'Erro ao criar'}</p>
        )}
      </div>

      {/* Tags list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-white/30" /></div>
      ) : tags.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <Tag size={24} className="text-white/30" />
          </div>
          <p className="text-sm font-semibold text-white mb-1">Nenhuma tag</p>
          <p className="text-xs text-white/40 max-w-xs mx-auto">
            Crie tags para categorizar suas conexoes (ex: "Conferencia", "Amigos", "Trabalho").
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {tags.map((tag: TagType) => (
            <motion.div
              key={tag.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition group flex items-center gap-3"
            >
              <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: tag.color || '#888' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{tag.name}</p>
                <p className="text-[10px] text-white/30">{tag.connectionCount} conexoes</p>
              </div>
              <button
                type="button"
                onClick={() => { if (confirm(`Deletar tag "${tag.name}"?`)) deleteTag.mutate(tag.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400/50 hover:text-red-400 transition"
              >
                <Trash2 size={12} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
