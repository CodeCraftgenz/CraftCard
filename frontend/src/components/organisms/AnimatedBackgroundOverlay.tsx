import { memo } from 'react';

interface AnimatedBackgroundOverlayProps {
  pattern: string;
  accent: string;
}

export const AnimatedBackgroundOverlay = memo(function AnimatedBackgroundOverlay({ pattern, accent }: AnimatedBackgroundOverlayProps) {
  switch (pattern) {
    case 'aurora':
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(135deg, ${accent}40, #D12BF230, #00B89420, ${accent}30)`,
              backgroundSize: '400% 400%',
              animation: 'aurora-shift 8s ease infinite',
            }}
          />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(ellipse at 20% 50%, ${accent}30 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, #D12BF225 0%, transparent 50%)`,
              backgroundSize: '200% 200%',
              animation: 'aurora-shift 12s ease infinite reverse',
            }}
          />
        </div>
      );

    case 'mesh-gradient':
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 opacity-25"
            style={{
              background: `
                radial-gradient(at 0% 0%, ${accent}35 0%, transparent 50%),
                radial-gradient(at 100% 0%, #D12BF230 0%, transparent 50%),
                radial-gradient(at 100% 100%, #00B89425 0%, transparent 50%),
                radial-gradient(at 0% 100%, ${accent}20 0%, transparent 50%)
              `,
              backgroundSize: '200% 200%',
              animation: 'mesh-move 10s ease infinite',
            }}
          />
        </div>
      );

    case 'particles':
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 2 + (i % 3) * 2,
                height: 2 + (i % 3) * 2,
                backgroundColor: i % 2 === 0 ? accent : '#D12BF2',
                left: `${(i * 23 + 5) % 95}%`,
                top: `${(i * 17 + 10) % 90}%`,
                opacity: 0.3 + (i % 4) * 0.15,
                animation: `particle-float ${3 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>
      );

    case 'waves-animated':
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg className="absolute bottom-0 left-0 w-[200%] opacity-15" viewBox="0 0 1200 200" preserveAspectRatio="none" style={{ animation: 'wave-flow 6s ease-in-out infinite' }}>
            <path d="M0 80 Q150 30 300 80 T600 80 T900 80 T1200 80 V200 H0 Z" fill={accent} />
          </svg>
          <svg className="absolute bottom-0 left-0 w-[200%] opacity-10" viewBox="0 0 1200 200" preserveAspectRatio="none" style={{ animation: 'wave-flow 8s ease-in-out infinite reverse' }}>
            <path d="M0 100 Q150 50 300 100 T600 100 T900 100 T1200 100 V200 H0 Z" fill="#D12BF2" />
          </svg>
        </div>
      );

    case 'gradient-flow':
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `linear-gradient(270deg, ${accent}30, #D12BF225, #00B89420, ${accent}30)`,
              backgroundSize: '600% 600%',
              animation: 'gradient-flow 8s ease infinite',
            }}
          />
        </div>
      );

    case 'starfield':
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: 1 + (i % 3),
                height: 1 + (i % 3),
                left: `${(i * 13 + 3) % 98}%`,
                top: `${(i * 19 + 7) % 96}%`,
                animation: `twinkle ${2 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      );

    default:
      return null;
  }
});
