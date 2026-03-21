import type { ReactNode } from 'react';

interface MobilePreviewProps {
  children: ReactNode;
  accentColor?: string;
}

export function MobilePreview({ children, accentColor }: MobilePreviewProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Phone Frame */}
      <div
        className="relative bg-black rounded-[36px] p-1.5 shadow-2xl shadow-black/50"
        style={{ width: 280, maxHeight: '70vh' }}
      >
        {/* Bezel highlight */}
        <div className="absolute inset-0 rounded-[36px] border border-white/10 pointer-events-none" />

        {/* Dynamic Island / Notch */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20">
          <div className="w-20 h-5 bg-black rounded-full flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          </div>
        </div>

        {/* Status Bar */}
        <div className="absolute top-2.5 left-6 right-6 z-10 flex items-center justify-between px-2 text-[9px] text-white/40 font-medium">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <div className="flex gap-px">
              <div className="w-[3px] h-[6px] bg-white/40 rounded-sm" />
              <div className="w-[3px] h-[8px] bg-white/40 rounded-sm" />
              <div className="w-[3px] h-[10px] bg-white/40 rounded-sm" />
              <div className="w-[3px] h-[12px] bg-white/30 rounded-sm" />
            </div>
            <span>5G</span>
            <div className="w-5 h-2.5 border border-white/40 rounded-sm relative">
              <div className="absolute inset-[1px] right-[3px] bg-white/40 rounded-sm" />
            </div>
          </div>
        </div>

        {/* Screen */}
        <div className="relative rounded-[30px] overflow-hidden bg-[#0a0a1a]" style={{ height: 'calc(70vh - 12px)' }}>
          {/* Scrollable content */}
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pt-7">
            {children}
          </div>

          {/* Glass highlight overlay */}
          <div className="absolute inset-0 rounded-[30px] pointer-events-none bg-gradient-to-br from-white/[0.02] via-transparent to-transparent z-10" />
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <div className="w-24 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Accent glow beneath the phone */}
        {accentColor && (
          <div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-2/3 h-6 rounded-full blur-xl opacity-15 transition-colors duration-500"
            style={{ backgroundColor: accentColor }}
          />
        )}
      </div>
    </div>
  );
}
