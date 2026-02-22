import { useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download } from 'lucide-react';

interface CustomQrCodeProps {
  url: string;
  fgColor?: string;
  bgColor?: string;
  logoUrl?: string | null;
  size?: number;
}

export function CustomQrCode({
  url,
  fgColor = '#00E4F2',
  bgColor = '#1A1A2E',
  logoUrl,
  size = 160,
}: CustomQrCodeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const canvas = wrapperRef.current?.querySelector('canvas');
    if (!canvas) return;

    // Create a higher-res canvas for download (300x300)
    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = 300;
    downloadCanvas.height = 300;
    const ctx = downloadCanvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, 0, 300, 300);

    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = downloadCanvas.toDataURL('image/png');
    link.click();
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={wrapperRef} className="rounded-xl overflow-hidden">
        <QRCodeCanvas
          value={url}
          size={size}
          fgColor={fgColor}
          bgColor={bgColor}
          level="H"
          imageSettings={
            logoUrl
              ? {
                  src: logoUrl,
                  height: size * 0.2,
                  width: size * 0.2,
                  excavate: true,
                }
              : undefined
          }
        />
      </div>
      <button
        type="button"
        onClick={handleDownload}
        className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
      >
        <Download size={12} />
        Baixar QR Code
      </button>
    </div>
  );
}
