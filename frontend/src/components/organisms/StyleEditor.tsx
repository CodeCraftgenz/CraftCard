/**
 * StyleEditor.tsx — Editor visual completo para personalizacao do cartao.
 *
 * Feature PRO+ que permite ao usuario customizar:
 * - Fonte (Google Fonts) e tamanho do texto
 * - Tipo de fundo (tema, gradiente, imagem, padrao SVG, animado)
 * - Layout dos links (lista vertical ou grid bento)
 * - Estilo visual dos links (arredondado, pill, quadrado, outline, ghost)
 * - Animacao de hover dos links (scale, slide, glow)
 * - Estilo dos icones (default, filled, outline, neomorph, glass, gradient)
 *
 * Componente memoizado para evitar re-renders desnecessarios durante edicao.
 * Quando a organizacao define um fundo, o controle de background e bloqueado (backgroundLockedByOrg).
 */

import { memo, useRef } from 'react';
import { Type, Paintbrush, MousePointerClick, Layers, ImageIcon, Upload, Trash2, Loader2, LayoutGrid, List, Palette } from 'lucide-react';
import { AVAILABLE_FONTS, loadGoogleFont } from '@/lib/google-fonts';
import {
  PRESET_GRADIENTS,
  PRESET_PATTERNS,
  ANIMATED_BACKGROUNDS,
  LINK_LAYOUTS,
  LINK_STYLES,
  LINK_ANIMATIONS,
  ICON_STYLES,
} from '@/lib/constants';

/** Estado completo de personalizacao visual de um cartao */
export interface VisualCustomization {
  fontFamily: string | null;
  fontSizeScale: number;
  backgroundType: string;
  backgroundGradient: string | null;
  backgroundImageUrl: string | null;
  backgroundOverlay: number;
  backgroundPattern: string | null;
  linkLayout: string;
  linkStyle: string;
  linkAnimation: string;
  iconStyle: string;
}

interface StyleEditorProps {
  /** Valores atuais de customizacao */
  value: VisualCustomization;
  /** Callback para atualizar um campo individual (propagado para debounce no pai) */
  onChange: <K extends keyof VisualCustomization>(key: K, val: VisualCustomization[K]) => void;
  /** Cor de destaque do cartao (usada nos previews de padrao e icone) */
  accent: string;
  onUploadBackground?: (file: File) => void;
  onDeleteBackground?: () => void;
  isUploadingBackground?: boolean;
  /** Se preenchido, mostra overlay informando que o fundo e controlado pela organizacao */
  backgroundLockedByOrg?: string | null;
}

/**
 * Editor principal de personalizacao visual.
 * Memoizado com React.memo para evitar re-renders quando props nao mudam.
 */
export const StyleEditor = memo(function StyleEditor({ value, onChange, accent, onUploadBackground, onDeleteBackground, isUploadingBackground, backgroundLockedByOrg }: StyleEditorProps) {
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
        <div className="relative">
          {backgroundLockedByOrg && (
            <div className="absolute inset-0 z-10 bg-dark-card/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-2 p-4">
              <Layers size={18} className="text-purple-400" />
              <p className="text-white/60 text-xs text-center">O fundo é definido pela organização <strong>{backgroundLockedByOrg}</strong></p>
            </div>
          )}
          <label className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={12} /> Fundo
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {(['theme', 'gradient', 'image', 'pattern', 'animated'] as const).map((type) => (
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
                {type === 'theme' ? 'Tema' : type === 'gradient' ? 'Gradiente' : type === 'image' ? 'Imagem' : type === 'pattern' ? 'Padrão' : 'Animado'}
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

          {/* Animated Backgrounds */}
          {value.backgroundType === 'animated' && (
            <div className="grid grid-cols-3 gap-2">
              {ANIMATED_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.value}
                  type="button"
                  onClick={() => onChange('backgroundPattern', bg.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    value.backgroundPattern === bg.value
                      ? 'border-brand-cyan shadow-md shadow-brand-cyan/20'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <AnimatedBgPreview type={bg.value} accent={accent} />
                  <span className="text-[10px] text-white/50 mt-1 block">{bg.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Link Layout */}
        <div>
          <label className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wider flex items-center gap-1.5">
            <LayoutGrid size={12} /> Layout dos Links
          </label>
          <div className="grid grid-cols-2 gap-2">
            {LINK_LAYOUTS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => onChange('linkLayout', l.value)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  (value.linkLayout || 'list') === l.value
                    ? 'border-brand-cyan shadow-md shadow-brand-cyan/20 bg-brand-cyan/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {l.value === 'list' ? <List size={16} className="text-white/70" /> : <LayoutGrid size={16} className="text-white/70" />}
                <span className="text-xs text-white/70 font-medium">{l.label}</span>
              </button>
            ))}
          </div>
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

        {/* Icon Style */}
        <div>
          <label className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wider flex items-center gap-1.5">
            <Palette size={12} /> Estilo dos Ícones
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ICON_STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => onChange('iconStyle', s.value)}
                className={`p-3 rounded-xl border-2 transition-all text-center ${
                  (value.iconStyle || 'default') === s.value
                    ? 'border-brand-cyan shadow-md shadow-brand-cyan/20'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <IconStylePreview style={s.value} accent={accent} />
                <span className="text-[10px] text-white/70 mt-1.5 block">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

/** Retorna classes CSS para preview dos estilos de link no editor */
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

/** Renderiza preview SVG miniatura de cada padrao de fundo disponivel */
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
    case 'hexagons':
      return (
        <svg width={size} height={size} className="mx-auto opacity-60">
          <pattern id={`p-hex-${pattern}`} width="17" height="20" patternUnits="userSpaceOnUse">
            <path d="M8.5 0 L17 5 L17 15 L8.5 20 L0 15 L0 5 Z" fill="none" stroke={color} strokeWidth="0.5" />
          </pattern>
          <rect width={size} height={size} fill={`url(#p-hex-${pattern})`} />
        </svg>
      );
    case 'topography':
      return (
        <svg width={size} height={size} className="mx-auto opacity-60">
          <path d="M5 10 Q15 5 25 12 Q35 20 45 10" fill="none" stroke={color} strokeWidth="0.5" />
          <path d="M0 20 Q10 15 20 22 Q30 28 40 18" fill="none" stroke={color} strokeWidth="0.5" />
          <path d="M5 30 Q15 25 25 32 Q35 38 45 28" fill="none" stroke={color} strokeWidth="0.5" />
        </svg>
      );
    case 'circuit':
      return (
        <svg width={size} height={size} className="mx-auto opacity-60">
          <path d="M5 5 H20 V15 H30 M10 25 H25 V35 M15 10 V30" fill="none" stroke={color} strokeWidth="0.5" />
          <circle cx="5" cy="5" r="1.5" fill={color} />
          <circle cx="25" cy="25" r="1.5" fill={color} />
          <circle cx="35" cy="15" r="1.5" fill={color} />
        </svg>
      );
    case 'confetti':
      return (
        <svg width={size} height={size} className="mx-auto opacity-60">
          <rect x="5" y="8" width="3" height="6" rx="1" fill={color} transform="rotate(30 6 11)" />
          <rect x="20" y="5" width="3" height="6" rx="1" fill={color} transform="rotate(-20 21 8)" />
          <rect x="12" y="22" width="3" height="6" rx="1" fill={color} transform="rotate(45 13 25)" />
          <rect x="30" y="20" width="3" height="6" rx="1" fill={color} transform="rotate(-15 31 23)" />
          <circle cx="28" cy="8" r="2" fill={color} />
          <circle cx="8" cy="30" r="2" fill={color} />
        </svg>
      );
    case 'stars':
      return (
        <svg width={size} height={size} className="mx-auto opacity-60">
          <path d="M10 2 L12 8 L18 8 L13 12 L15 18 L10 14 L5 18 L7 12 L2 8 L8 8 Z" fill={color} />
          <path d="M30 15 L31.5 19 L35 19 L32.5 21.5 L33.5 25 L30 22.5 L26.5 25 L27.5 21.5 L25 19 L28.5 19 Z" fill={color} transform="scale(0.6)" />
        </svg>
      );
    case 'zigzag':
      return (
        <svg width={size} height={size} className="mx-auto opacity-60">
          <pattern id={`p-zigzag-${pattern}`} width="16" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 4 L4 0 L8 4 L12 0 L16 4" fill="none" stroke={color} strokeWidth="0.6" />
          </pattern>
          <rect width={size} height={size} fill={`url(#p-zigzag-${pattern})`} />
        </svg>
      );
    default:
      return <div className="w-10 h-10 bg-white/5 rounded mx-auto" />;
  }
}

/** Renderiza preview estatico dos fundos animados (aurora, mesh, particulas, etc) */
function AnimatedBgPreview({ type, accent }: { type: string; accent: string }) {
  const baseClass = 'w-10 h-10 rounded-lg mx-auto overflow-hidden';
  switch (type) {
    case 'aurora':
      return <div className={baseClass} style={{ background: `linear-gradient(135deg, ${accent}40, #D12BF230, ${accent}20)` }} />;
    case 'mesh-gradient':
      return <div className={baseClass} style={{ background: `radial-gradient(at 20% 30%, ${accent}30 0%, transparent 50%), radial-gradient(at 80% 70%, #D12BF225 0%, transparent 50%)` }} />;
    case 'particles':
      return <div className={baseClass} style={{ background: '#0a0a1a' }}><div className="w-1 h-1 rounded-full absolute" style={{ backgroundColor: accent, top: 8, left: 12 }} /><div className="w-0.5 h-0.5 rounded-full absolute" style={{ backgroundColor: accent, top: 20, left: 28 }} /></div>;
    case 'waves-animated':
      return <div className={baseClass} style={{ background: `linear-gradient(180deg, transparent, ${accent}30)` }} />;
    case 'gradient-flow':
      return <div className={baseClass} style={{ background: `linear-gradient(45deg, ${accent}30, #D12BF220, ${accent}15)` }} />;
    case 'starfield':
      return <div className={baseClass} style={{ background: '#050510' }}><div className="w-0.5 h-0.5 rounded-full bg-white/60 absolute" style={{ top: 8, left: 15 }} /><div className="w-0.5 h-0.5 rounded-full bg-white/40 absolute" style={{ top: 20, left: 28 }} /></div>;
    default:
      return <div className={`${baseClass} bg-white/5`} />;
  }
}

/** Renderiza preview dos estilos de icone (default, filled, outline, neomorph, glass, gradient) */
function IconStylePreview({ style, accent }: { style: string; accent: string }) {
  const iconPath = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z";

  switch (style) {
    case 'default':
      return (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto" style={{ backgroundColor: `${accent}20` }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill={accent}><path d={iconPath} /></svg>
        </div>
      );
    case 'filled':
      return (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto" style={{ backgroundColor: accent }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="#fff"><path d={iconPath} /></svg>
        </div>
      );
    case 'outline':
      return (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto bg-transparent" style={{ border: `2px solid ${accent}` }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill={accent}><path d={iconPath} /></svg>
        </div>
      );
    case 'neomorph':
      return (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto bg-white/10" style={{ boxShadow: `4px 4px 8px rgba(0,0,0,0.3), -2px -2px 6px rgba(255,255,255,0.05), inset 0 0 0 1px ${accent}30` }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill={accent}><path d={iconPath} /></svg>
        </div>
      );
    case 'glass':
      return (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto backdrop-blur-sm" style={{ backgroundColor: `${accent}15`, border: `1px solid ${accent}30`, boxShadow: `0 2px 8px ${accent}20` }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill={accent}><path d={iconPath} /></svg>
        </div>
      );
    case 'gradient':
      return (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}88)` }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="#fff"><path d={iconPath} /></svg>
        </div>
      );
    default:
      return (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto" style={{ backgroundColor: `${accent}20` }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill={accent}><path d={iconPath} /></svg>
        </div>
      );
  }
}
