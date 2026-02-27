import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Webhook, Plus, Trash2, ToggleLeft, ToggleRight,
  Copy, Check, Send, ExternalLink, Shield, AlertTriangle, Loader2,
} from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import { FeatureLock } from '@/components/organisms/FeatureLock';
import { useAuth } from '@/providers/AuthProvider';
import {
  useWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useTestWebhook,
  type Webhook as WebhookType,
} from '@/hooks/useWebhooks';

const AVAILABLE_EVENTS = [
  { key: 'new_message', label: 'Nova mensagem', description: 'Quando um visitante envia mensagem pelo cartao' },
  { key: 'new_booking', label: 'Novo agendamento', description: 'Quando um visitante agenda um horario' },
  { key: 'new_testimonial', label: 'Novo depoimento', description: 'Quando um visitante deixa um depoimento' },
] as const;

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function WebhooksPage() {
  const { hasFeature } = useAuth();

  return (
    <div className="min-h-screen bg-brand-dark">
      <Header />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-8">
        <Link
          to="/editor"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Voltar ao Editor
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Webhook size={28} className="text-brand-cyan" />
          <div>
            <h1 className="text-2xl font-bold text-white">Integracoes & Webhooks</h1>
            <p className="text-white/40 text-sm">Conecte seu cartao a ferramentas externas como Zapier, HubSpot e Make</p>
          </div>
        </div>

        <FeatureLock feature="webhooks">
          <WebhooksContent />
        </FeatureLock>
      </div>
    </div>
  );
}

function WebhooksContent() {
  const { data: webhooks, isLoading } = useWebhooks();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-white/50">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-cyan/5 border border-brand-cyan/20 rounded-2xl p-5"
      >
        <h3 className="text-brand-cyan font-medium text-sm mb-2">Como funciona?</h3>
        <p className="text-white/50 text-xs leading-relaxed">
          Webhooks enviam dados automaticamente para uma URL quando eventos acontecem no seu cartao.
          Use com Zapier, Make, HubSpot ou qualquer ferramenta que aceite webhooks.
          Cada envio inclui assinatura HMAC-SHA256 no header <code className="text-brand-cyan/80 bg-white/5 px-1 rounded">X-CraftCard-Signature</code> para validacao.
        </p>
      </motion.div>

      {/* Add webhook button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          disabled={(webhooks?.length ?? 0) >= 5}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-white/10 rounded-2xl text-white/40 hover:text-brand-cyan hover:border-brand-cyan/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          <span className="text-sm font-medium">Adicionar Webhook</span>
          {(webhooks?.length ?? 0) >= 5 && <span className="text-xs">(maximo 5)</span>}
        </button>
      )}

      {/* Create form */}
      {showForm && (
        <CreateWebhookForm onClose={() => setShowForm(false)} />
      )}

      {/* Webhook list */}
      {webhooks && webhooks.length > 0 ? (
        <div className="space-y-4">
          {webhooks.map((wh) => (
            <WebhookCard key={wh.id} webhook={wh} />
          ))}
        </div>
      ) : !showForm ? (
        <div className="text-center py-12">
          <Webhook size={48} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/30 text-sm">Nenhum webhook configurado</p>
          <p className="text-white/20 text-xs mt-1">Adicione um webhook para comecar a receber dados em tempo real</p>
        </div>
      ) : null}

      {/* Usage info */}
      <div className="text-center text-white/20 text-xs">
        {webhooks?.length ?? 0}/5 webhooks utilizados
      </div>
    </div>
  );
}

function CreateWebhookForm({ onClose }: { onClose: () => void }) {
  const createWebhook = useCreateWebhook();
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [urlError, setUrlError] = useState('');

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  const handleSubmit = async () => {
    setUrlError('');

    if (!url.trim()) {
      setUrlError('URL e obrigatoria');
      return;
    }
    if (!isValidUrl(url.trim())) {
      setUrlError('URL invalida. Use formato https://...');
      return;
    }
    if (selectedEvents.length === 0) {
      setUrlError('Selecione pelo menos um evento');
      return;
    }

    await createWebhook.mutateAsync({ url: url.trim(), events: selectedEvents });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Novo Webhook</h3>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 text-xs">
          Cancelar
        </button>
      </div>

      {/* URL input */}
      <div>
        <label className="text-white/40 text-xs block mb-1">URL de destino</label>
        <input
          value={url}
          onChange={(e) => { setUrl(e.target.value); setUrlError(''); }}
          placeholder="https://hooks.zapier.com/..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-cyan/50"
        />
        {urlError && <p className="text-red-400 text-xs mt-1">{urlError}</p>}
      </div>

      {/* Events checkboxes */}
      <div>
        <label className="text-white/40 text-xs block mb-2">Eventos para escutar</label>
        <div className="space-y-2">
          {AVAILABLE_EVENTS.map((evt) => (
            <label
              key={evt.key}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                selectedEvents.includes(evt.key)
                  ? 'bg-brand-cyan/10 border-brand-cyan/30'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedEvents.includes(evt.key)}
                onChange={() => toggleEvent(evt.key)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                selectedEvents.includes(evt.key)
                  ? 'bg-brand-cyan border-brand-cyan'
                  : 'border-white/20'
              }`}>
                {selectedEvents.includes(evt.key) && <Check size={10} className="text-black" />}
              </div>
              <div>
                <span className="text-white text-sm">{evt.label}</span>
                <p className="text-white/30 text-xs">{evt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={createWebhook.isPending}
        className="w-full py-2.5 bg-brand-cyan/20 text-brand-cyan rounded-xl text-sm font-medium hover:bg-brand-cyan/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {createWebhook.isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Plus size={16} />
        )}
        Criar Webhook
      </button>
    </motion.div>
  );
}

function WebhookCard({ webhook }: { webhook: WebhookType }) {
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const testWebhook = useTestWebhook();
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const copySecret = () => {
    navigator.clipboard.writeText(webhook.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleActive = () => {
    updateWebhook.mutate({ id: webhook.id, isActive: !webhook.isActive });
  };

  const handleTest = async () => {
    setTestResult(null);
    try {
      await testWebhook.mutateAsync(webhook.id);
      setTestResult('success');
      setTimeout(() => setTestResult(null), 3000);
    } catch {
      setTestResult('error');
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    deleteWebhook.mutate(webhook.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/5 rounded-2xl p-5 border transition-colors ${
        webhook.isActive ? 'border-white/10' : 'border-white/5 opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ExternalLink size={14} className="text-brand-cyan flex-shrink-0" />
            <p className="text-white text-sm font-mono truncate">{webhook.url}</p>
          </div>
          <p className="text-white/30 text-xs">
            Criado em {new Date(webhook.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Toggle */}
        <button
          onClick={toggleActive}
          aria-label={webhook.isActive ? 'Desativar webhook' : 'Ativar webhook'}
          className="flex-shrink-0"
        >
          {webhook.isActive ? (
            <ToggleRight size={28} className="text-brand-cyan" />
          ) : (
            <ToggleLeft size={28} className="text-white/20" />
          )}
        </button>
      </div>

      {/* Events */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {webhook.events.map((evt) => {
          const eventInfo = AVAILABLE_EVENTS.find((e) => e.key === evt);
          return (
            <span
              key={evt}
              className="px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan text-xs"
            >
              {eventInfo?.label || evt}
            </span>
          );
        })}
      </div>

      {/* Secret */}
      <div className="flex items-center gap-2 mb-4 bg-white/5 rounded-xl px-3 py-2">
        <Shield size={14} className="text-white/30 flex-shrink-0" />
        <span className="text-white/40 text-xs flex-shrink-0">Secret:</span>
        <code className="text-white/60 text-xs font-mono truncate flex-1">{webhook.secret}</code>
        <button
          onClick={copySecret}
          aria-label="Copiar secret"
          className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleTest}
          disabled={testWebhook.isPending || !webhook.isActive}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg text-white/50 text-xs hover:bg-white/10 hover:text-white/70 transition-colors disabled:opacity-30"
        >
          {testWebhook.isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Send size={12} />
          )}
          Testar
        </button>

        {testResult === 'success' && (
          <span className="text-green-400 text-xs flex items-center gap-1">
            <Check size={12} /> Enviado com sucesso
          </span>
        )}
        {testResult === 'error' && (
          <span className="text-red-400 text-xs flex items-center gap-1">
            <AlertTriangle size={12} /> Falha no envio
          </span>
        )}

        <div className="flex-1" />

        <button
          onClick={handleDelete}
          disabled={deleteWebhook.isPending}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
            confirmDelete
              ? 'bg-red-500/20 text-red-400'
              : 'bg-white/5 text-white/30 hover:bg-red-500/10 hover:text-red-400'
          }`}
        >
          <Trash2 size={12} />
          {confirmDelete ? 'Confirmar exclusao?' : 'Excluir'}
        </button>
      </div>
    </motion.div>
  );
}
