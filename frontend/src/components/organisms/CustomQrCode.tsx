import { useRef, useCallback, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Copy, Check } from 'lucide-react';

export interface QrCodeSettings {
  fgColor: string;
  bgColor: string;
  frameText: string;
  showLogo: boolean;
}

export const DEFAULT_QR_SETTINGS: QrCodeSettings = {
  fgColor: '#00E4F2',
  bgColor: '#1A1A2E',
  frameText: '',
  showLogo: true,
};

interface CustomQrCodeProps {
  url: string;
  fgColor?: string;
  bgColor?: string;
  logoUrl?: string | null;
  size?: number;
  frameText?: string;
  showLogo?: boolean;
  showActions?: boolean;
}

export function CustomQrCode({
  url,
  fgColor = '#00E4F2',
  bgColor = '#1A1A2E',
  logoUrl,
  size = 160,
  frameText,
  showLogo = true,
  showActions = true,
}: CustomQrCodeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const effectiveLogo = showLogo ? logoUrl : null;
  const hasFrame = !!frameText;
  const padding = 16;
  const frameHeight = hasFrame ? 32 : 0;
  const totalWidth = size + padding * 2;
  const totalHeight = size + padding * 2 + frameHeight;

  const handleDownloadPng = useCallback(() => {
    const canvas = wrapperRef.current?.querySelector('canvas');
    if (!canvas) return;

    const scale = 3;
    const dlWidth = totalWidth * scale;
    const dlHeight = totalHeight * scale;
    const dlPadding = padding * scale;
    const dlSize = size * scale;

    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = dlWidth;
    downloadCanvas.height = dlHeight;
    const ctx = downloadCanvas.getContext('2d');
    if (!ctx) return;

    // Draw background with rounded corners
    ctx.fillStyle = bgColor;
    const radius = 16 * scale;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(dlWidth - radius, 0);
    ctx.quadraticCurveTo(dlWidth, 0, dlWidth, radius);
    ctx.lineTo(dlWidth, dlHeight - radius);
    ctx.quadraticCurveTo(dlWidth, dlHeight, dlWidth - radius, dlHeight);
    ctx.lineTo(radius, dlHeight);
    ctx.quadraticCurveTo(0, dlHeight, 0, dlHeight - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();

    // Draw QR code
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, dlPadding, dlPadding, dlSize, dlSize);

    // Draw frame text
    if (hasFrame) {
      ctx.fillStyle = fgColor;
      ctx.font = `bold ${14 * scale}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(frameText!, dlWidth / 2, dlPadding + dlSize + (frameHeight * scale) / 2);
    }

    const link = document.createElement('a');
    link.download = 'craftcard-qrcode.png';
    link.href = downloadCanvas.toDataURL('image/png');
    link.click();
  }, [bgColor, fgColor, frameText, hasFrame, size, totalWidth, totalHeight, frameHeight]);

  const handleCopyImage = useCallback(async () => {
    const canvas = wrapperRef.current?.querySelector('canvas');
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback: download
      handleDownloadPng();
    }
  }, [handleDownloadPng]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={wrapperRef}
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: bgColor,
          padding: `${padding}px`,
          paddingBottom: hasFrame ? `${padding / 2}px` : `${padding}px`,
        }}
      >
        <QRCodeCanvas
          value={url}
          size={size}
          fgColor={fgColor}
          bgColor={bgColor}
          level="H"
          imageSettings={
            effectiveLogo
              ? {
                  src: effectiveLogo,
                  height: size * 0.2,
                  width: size * 0.2,
                  excavate: true,
                }
              : undefined
          }
        />
        {hasFrame && (
          <p
            className="text-center font-bold mt-1 text-xs truncate"
            style={{ color: fgColor, maxWidth: `${size}px` }}
          >
            {frameText}
          </p>
        )}
      </div>
      {showActions && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadPng}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            <Download size={12} />
            PNG
          </button>
          <button
            type="button"
            onClick={handleCopyImage}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      )}
    </div>
  );
}
