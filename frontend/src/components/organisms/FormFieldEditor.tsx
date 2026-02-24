import { useState } from 'react';
import { Plus, X, FileText } from 'lucide-react';
import {
  useFormFields,
  useCreateFormField,
  useUpdateFormField,
  useDeleteFormField,
  type FormField,
} from '@/hooks/useFormFields';

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Telefone' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'date', label: 'Data' },
  { value: 'select', label: 'Selecao' },
];

interface FormFieldEditorProps {
  cardId?: string;
}

export function FormFieldEditor({ cardId }: FormFieldEditorProps) {
  const { data: fields = [] } = useFormFields(cardId);
  const createField = useCreateFormField();
  const updateField = useUpdateFormField();
  const deleteField = useDeleteFormField();

  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('text');

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    createField.mutate({ label: newLabel.trim(), type: newType, cardId });
    setNewLabel('');
    setNewType('text');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <FileText size={16} className="text-brand-cyan" />
        Campos do Formulario
      </div>
      <p className="text-xs text-white/40">
        Personalize os campos do formulario de contato do seu cartao.
      </p>

      {/* Existing fields */}
      <div className="space-y-2">
        {fields.map((field) => (
          <FieldRow
            key={field.id}
            field={field}
            onUpdate={(data) => updateField.mutate({ id: field.id, ...data })}
            onDelete={() => deleteField.mutate(field.id)}
          />
        ))}
      </div>

      {/* Add new field */}
      {fields.length < 10 && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nome do campo"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:border-brand-cyan/50 focus:outline-none"
            maxLength={50}
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:border-brand-cyan/50 focus:outline-none"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newLabel.trim() || createField.isPending}
            className="px-3 py-2 rounded-lg bg-brand-cyan/10 text-brand-cyan text-sm hover:bg-brand-cyan/20 transition-colors disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function FieldRow({ field, onUpdate, onDelete }: {
  field: FormField;
  onUpdate: (data: Partial<FormField>) => void;
  onDelete: () => void;
}) {
  const typeName = FIELD_TYPES.find((t) => t.value === field.type)?.label || field.type;

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
      <span className="flex-1 text-sm text-white truncate">{field.label}</span>
      <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded">{typeName}</span>
      <label className="flex items-center gap-1 text-[10px] text-white/40">
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => onUpdate({ required: e.target.checked })}
          className="rounded"
        />
        Obrigatorio
      </label>
      <button
        type="button"
        onClick={onDelete}
        className="text-white/20 hover:text-red-400 transition-colors"
        title="Remover"
      >
        <X size={14} />
      </button>
    </div>
  );
}
