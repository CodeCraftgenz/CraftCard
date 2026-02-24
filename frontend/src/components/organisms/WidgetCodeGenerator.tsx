import { useState, useCallback } from 'react';
import { Copy, Check, Code } from 'lucide-react';

interface WidgetCodeGeneratorProps {
  slug: string;
}

export function WidgetCodeGenerator({ slug }: WidgetCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);

  const widgetUrl = `${window.location.origin}/widget/${slug}`;
  const embedCode = `<iframe src="${widgetUrl}" width="300" height="420" style="border:none;border-radius:16px;" title="CraftCard"></iframe>`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [embedCode]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Code size={16} className="text-brand-cyan" />
        Widget Embed
      </div>

      <p className="text-xs text-white/40">
        Adicione seu cartao em qualquer site com o codigo abaixo:
      </p>

      <div className="p-3 rounded-lg bg-black/30 border border-white/10 font-mono text-[11px] text-white/70 break-all select-all">
        {embedCode}
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        {copied ? 'Codigo copiado!' : 'Copiar codigo'}
      </button>
    </div>
  );
}
