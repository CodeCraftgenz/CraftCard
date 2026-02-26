import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

interface Props {
  id: number;
  children: React.ReactNode;
  onRemove: () => void;
}

export const SortableLinkItem = memo(function SortableLinkItem({ id, children, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5 min-w-0 overflow-hidden"
    >
      <button
        type="button"
        {...listeners}
        className="mt-2.5 shrink-0 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Arrastar para reordenar"
      >
        <GripVertical size={16} className="text-white/15" />
      </button>
      <div className="flex-1 min-w-0 space-y-2">
        {children}
      </div>
      <button
        type="button"
        onClick={onRemove}
        title="Remover link"
        className="mt-2 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
      >
        <X size={14} />
      </button>
    </div>
  );
});
