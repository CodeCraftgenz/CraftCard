import type { ReactNode } from 'react';

interface MobilePreviewProps {
  children: ReactNode;
}

export function MobilePreview({ children }: MobilePreviewProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Phone Frame */}
      <div
        className="relative bg-black rounded-[40px] p-2 shadow-2xl shadow-black/50"
        style={{ width: 340, maxHeight: '80vh' }}
      >
        {/* Bezel highlight */}
        <div className="absolute inset-0 rounded-[40px] border border-white/10 pointer-events-none" />

        {/* Dynamic Island / Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
          <div className="w-24 h-6 bg-black rounded-full flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/10" />
          </div>
        </div>

        {/* Status Bar */}
        <div className="absolute top-3 left-8 right-8 z-10 flex items-center justify-between px-2 text-[10px] text-white/40 font-medium">
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
        <div className="relative rounded-[32px] overflow-hidden bg-[#0a0a1a]" style={{ height: 'calc(80vh - 16px)' }}>
          {/* Scrollable content */}
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pt-8">
            {children}
          </div>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <div className="w-28 h-1 bg-white/20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
