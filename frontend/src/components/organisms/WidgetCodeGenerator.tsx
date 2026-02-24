import { useState, useCallback } from 'react';
import { Copy, Check, Code, Maximize2, Minimize2, Monitor } from 'lucide-react';

interface WidgetCodeGeneratorProps {
  slug: string;
}

const SIZES = [
  { label: 'Compacto', value: 'compact', icon: Minimize2, width: 280, height: 380 },
  { label: 'Padrao', value: 'standard', icon: Monitor, width: 320, height: 450 },
  { label: 'Grande', value: 'large', icon: Maximize2, width: 380, height: 550 },
] as const;

type SizeKey = typeof SIZES[number]['value'];

export function WidgetCodeGenerator({ slug }: WidgetCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [size, setSize] = useState<SizeKey>('standard');

  const selected = SIZES.find((s) => s.value === size)!;
  const widgetUrl = `${window.location.origin}/widget/${slug}`;
  const embedCode = `<iframe src="${widgetUrl}" width="${selected.width}" height="${selected.height}" style="border:none;border-radius:16px;" title="CraftCard"></iframe>`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [embedCode]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Code size={16} className="text-brand-cyan" />
        Widget Embed
      </div>

      <p className="text-xs text-white/40">
        Adicione seu cartao em qualquer site colando o codigo abaixo.
      </p>

      {/* Size selector */}
      <div className="grid grid-cols-3 gap-2">
        {SIZES.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setSize(s.value)}
              className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border transition-all ${
                size === s.value
                  ? 'border-brand-cyan/50 bg-brand-cyan/10 text-brand-cyan'
                  : 'border-white/10 text-white/50 hover:border-white/20 hover:bg-white/[0.03]'
              }`}
            >
              <Icon size={14} />
              <span className="text-[11px] font-medium">{s.label}</span>
              <span className="text-[9px] text-white/30">{s.width}x{s.height}</span>
            </button>
          );
        })}
      </div>

      {/* Live preview */}
      <div className="rounded-xl border border-white/10 bg-black/20 p-4 flex justify-center overflow-hidden">
        <div
          className="rounded-2xl overflow-hidden shadow-lg shadow-brand-cyan/5 transition-all duration-300"
          style={{ width: Math.min(selected.width, 280), height: Math.min(selected.height, 380) }}
        >
          <iframe
            src={widgetUrl}
            width="100%"
            height="100%"
            style={{ border: 'none', borderRadius: 16 }}
            title="CraftCard Preview"
          />
        </div>
      </div>

      {/* Code block */}
      <div className="relative group">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-xl bg-white/[0.06] border border-b-0 border-white/10">
          <Code size={10} className="text-white/30" />
          <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">HTML</span>
        </div>
        <div className="p-3 rounded-b-xl bg-black/40 border border-white/10 font-mono text-[11px] text-brand-cyan/70 break-all leading-relaxed select-all">
          {embedCode}
        </div>
      </div>

      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopy}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
          copied
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'border border-white/10 text-white/70 hover:text-white hover:bg-white/5'
        }`}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Codigo copiado!' : 'Copiar codigo'}
      </button>
    </div>
  );
}
