import { memo, useRef } from 'react';
import { Type, Paintbrush, MousePointerClick, Layers, ImageIcon, Upload, Trash2, Loader2 } from 'lucide-react';
import { AVAILABLE_FONTS, loadGoogleFont } from '@/lib/google-fonts';
import {
  PRESET_GRADIENTS,
  PRESET_PATTERNS,
  LINK_STYLES,
  LINK_ANIMATIONS,
} from '@/lib/constants';

export interface VisualCustomization {
  fontFamily: string | null;
  fontSizeScale: number;
  backgroundType: string;
  backgroundGradient: string | null;
  backgroundImageUrl: string | null;
  backgroundOverlay: number;
  backgroundPattern: string | null;
  linkStyle: string;
  linkAnimation: string;
}

interface StyleEditorProps {
  value: VisualCustomization;
  onChange: <K extends keyof VisualCustomization>(key: K, val: VisualCustomization[K]) => void;
  accent: string;
  onUploadBackground?: (file: File) => void;
  onDeleteBackground?: () => void;
  isUploadingBackground?: boolean;
}

export const StyleEditor = memo(function StyleEditor({ value, onChange, accent, onUploadBackground, onDeleteBackground, isUploadingBackground }: StyleEditorProps) {
  const bgFileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="glass-card p-6 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
          <Paintbrush size={16} className="text-pink-400" />
        </div>
        <h3 className="font-semibold">Personalizar Visual</h3>
        <span className="text-xs text-white/30 ml-auto px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">PRO</span>
      </div>

      <div className="space-y-6">
        {/* Font Family */}
        <div>
          <label className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wider flex items-center gap-1.5">
            <Type size={12} /> Fonte
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AVAILABLE_FONTS.map((font) => (
              <button
                key={font}
                type="button"
                onClick={() => {
                  loadGoogleFont(font);
                  onChange('fontFamily', font);
                }}
                className={`p-2.5 rounded-xl border-2 transition-all text-center ${
                  (value.fontFamily || 'Inter') === font
                    ? 'border-brand-cyan shadow-md shadow-brand-cyan/20'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <span
                  className="text-xs text-white/70 block truncate"
                  style={{ fontFamily: font }}
                >
                  {font}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size Scale */}
        <div>
          <label className="text-xs font-medium text-white/50 mb-2 block uppercase tracking-wider">
            Tamanho do texto: {((value.fontSizeScale ?? 1) * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min={0.8}
            max={1.3}
            step={0.05}
            value={value.fontSizeScale ?? 1}
            onChange={(e) => onChange('fontSizeScale', parseFloat(e.target.value))}
            aria-label="Tamanho do texto"
            className="w-full accent-brand-cyan"
          />
          <div className="flex justify-between text-[10px] text-white/20 mt-1">
            <span>80%</span>
            <span>130%</span>
          </div>
        </div>

        {/* Background Type */}
        <div>
          <label className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={12} /> Fundo
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {(['theme', 'gradient', 'image', 'pattern'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onChange('backgroundType', type)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  value.backgroundType === type
                    ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/20'
                }`}
              >
                {type === 'theme' ? 'Tema' : type === 'gradient' ? 'Gradiente' : type === 'image' ? 'Imagem' : 'Padrao'}
              </button>
            ))}
          </div>

          {/* Gradient Presets */}
          {value.backgroundType === 'gradient' && (
            <div className="grid grid-cols-4 gap-2">
              {PRESET_GRADIENTS.map((g) => {
                const [angle, c1, c2] = g.value.split(',');
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => onChange('backgroundGradient', g.value)}
                    className={`h-12 rounded-xl border-2 transition-all ${
                      value.backgroundGradient === g.value
                        ? 'border-white shadow-md'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    style={{ background: `linear-gradient(${angle},${c1},${c2})` }}
                    title={g.label}
                  />
                );
              })}
            </div>
          )}

          {/* Image Upload */}
          {value.backgroundType === 'image' && (
            <div className="space-y-3">
              <input
                ref={bgFileRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                aria-label="Escolher imagem de fundo"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && onUploadBackground) onUploadBackground(file);
                  e.target.value = '';
                }}
              />

              {value.backgroundImageUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={value.backgroundImageUrl}
                    alt="Background"
                    className="w-full h-28 object-cover"
                  />
                  <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${value.backgroundOverlay})` }} />
                  <div className="absolute bottom-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => bgFileRef.current?.click()}
                      disabled={isUploadingBackground}
                      className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                      title="Trocar imagem"
                    >
                      <Upload size={14} className="text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={onDeleteBackground}
                      className="p-1.5 rounded-lg bg-red-500/20 backdrop-blur-sm hover:bg-red-500/30 transition-colors"
                      title="Remover imagem"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => bgFileRef.current?.click()}
                  disabled={isUploadingBackground}
                  className="w-full h-24 rounded-xl border-2 border-dashed border-white/10 hover:border-white/20 flex flex-col items-center justify-center gap-2 transition-colors"
                >
                  {isUploadingBackground ? (
                    <Loader2 size={20} className="text-brand-cyan animate-spin" />
                  ) : (
                    <>
                      <ImageIcon size={20} className="text-white/30" />
                      <span className="text-xs text-white/40">Escolher imagem de fundo</span>
                    </>
                  )}
                </button>
              )}

              {/* Overlay slider */}
              <div>
                <label className="text-xs text-white/40 mb-1 block">
                  Escurecimento: {Math.round(value.backgroundOverlay * 100)}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={value.backgroundOverlay}
                  onChange={(e) => onChange('backgroundOverlay', parseFloat(e.target.value))}
                  aria-label="Escurecimento do fundo"
                  className="w-full accent-brand-cyan"
                />
                <div className="flex justify-between text-[10px] text-white/20 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}

          {/* Pattern Presets */}
          {value.backgroundType === 'pattern' && (
            <div className="grid grid-cols-3 gap-2">
              {PRESET_PATTERNS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onChange('backgroundPattern', p.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    value.backgroundPattern === p.value
                      ? 'border-brand-cyan shadow-md shadow-brand-cyan/20'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <PatternPreview pattern={p.value} accent={accent} />
                  <span className="text-[10px] text-white/50 mt-1 block">{p.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Link Style */}
        <div>
          <label className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wider flex items-center gap-1.5">
            <MousePointerClick size={12} /> Estilo dos Links
          </label>
          <div className="grid grid-cols-5 gap-2">
            {LINK_STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => onChange('linkStyle', s.value)}
                className={`p-2 border-2 transition-all text-center ${
                  value.linkStyle === s.value
                    ? 'border-brand-cyan shadow-md shadow-brand-cyan/20'
                    : 'border-white/10 hover:border-white/20'
                } ${getLinkStylePreviewClass(s.value)}`}
              >
                <span className="text-[10px] text-white/70">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Link Animation */}
        <div>
          <label className="text-xs font-medium text-white/50 mb-3 block uppercase tracking-wider">Animacao dos Links</label>
          <div className="grid grid-cols-4 gap-2">
            {LINK_ANIMATIONS.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => onChange('linkAnimation', a.value)}
                className={`p-2.5 rounded-xl border-2 transition-all text-center ${
                  value.linkAnimation === a.value
                    ? 'border-brand-cyan shadow-md shadow-brand-cyan/20'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <span className="text-[10px] text-white/70">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

function getLinkStylePreviewClass(style: string): string {
  switch (style) {
    case 'rounded': return 'rounded-2xl';
    case 'pill': return 'rounded-full';
    case 'square': return 'rounded-none';
    case 'outline': return 'rounded-2xl bg-transparent';
    case 'ghost': return 'rounded-2xl bg-transparent border-transparent';
    default: return 'rounded-2xl';
  }
}

function PatternPreview({ pattern, accent }: { pattern: string; accent: string }) {
  const size = 40;
  const color = `${accent}40`;
  switch (pattern) {
    case 'dots':
      return (
        <svg width={size} height={size} className="mx-auto opacity-60">
          <pattern id={`p-dots-${pattern}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill={color} />
          </pattern>
          <rect width={size} height={size} fill={`url(#p-dots-${pattern})`} />
        </svg>
      );
    case 'grid':
      return (
        <svg width={size} height={size} className="mx-auto opacity-60">
          <pattern id={`p-grid-${pattern}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke={color} strokeWidth="0.5" />
          </pattern>
          <rect width={size} height={size} fill={`url(#p-grid-${pattern})`} />
        </svg>
      );
    case 'waves':
      return (
        <svg width={size} height={size} className="mx-auto opacity-60">
          <pattern id={`p-waves-${pattern}`} width="20" height="10" patternUnits="userSpaceOnUse">
            <path d="M0 5 Q5 0 10 5 T20 5" fill="none" stroke={color} strokeWidth="0.8" />
          </pattern>
          <rect width={size} height={size} fill={`url(#p-waves-${pattern})`} />
        </svg>
      );
    case 'circles':
      return (
        <svg width={size} height={size} className="mx-auto opacity-60">
          <pattern id={`p-circles-${pattern}`} width="15" height="15" patternUnits="userSpaceOnUse">
            <circle cx="7.5" cy="7.5" r="4" fill="none" stroke={color} strokeWidth="0.5" />
          </pattern>
          <rect width={size} height={size} fill={`url(#p-circles-${pattern})`} />
        </svg>
      );
    case 'diagonal':
      return (
        <svg width={size} height={size} className="mx-auto opacity-60">
          <pattern id={`p-diag-${pattern}`} width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 8 L8 0" stroke={color} strokeWidth="0.5" />
          </pattern>
          <rect width={size} height={size} fill={`url(#p-diag-${pattern})`} />
        </svg>
      );
    case 'cross':
      return (
        <svg width={size} height={size} className="mx-auto opacity-60">
          <pattern id={`p-cross-${pattern}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M5 0 V10 M0 5 H10" stroke={color} strokeWidth="0.5" />
          </pattern>
          <rect width={size} height={size} fill={`url(#p-cross-${pattern})`} />
        </svg>
      );
    default:
      return <div className="w-10 h-10 bg-white/5 rounded mx-auto" />;
  }
}
