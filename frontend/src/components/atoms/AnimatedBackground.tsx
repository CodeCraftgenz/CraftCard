import { useMemo } from 'react';

interface AnimatedBackgroundProps {
  theme: string;
}

function Particles({ count, color, className }: { count: number; color: string; className?: string }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 4,
        delay: `${Math.random() * 6}s`,
        duration: `${4 + Math.random() * 4}s`,
      })),
    [count],
  );

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full animate-float ${className || ''}`}
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            opacity: 0.4,
          }}
        />
      ))}
    </>
  );
}

function GlowOrbs({ color }: { color: string }) {
  const orbs = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        id: i,
        left: `${15 + i * 20}%`,
        top: `${20 + (i % 2) * 40}%`,
        size: 60 + i * 20,
        delay: `${i * 0.8}s`,
      })),
    [],
  );

  return (
    <>
      {orbs.map((o) => (
        <div
          key={o.id}
          className="absolute rounded-full animate-glow blur-2xl"
          style={{
            left: o.left,
            top: o.top,
            width: o.size,
            height: o.size,
            backgroundColor: color,
            animationDelay: o.delay,
            opacity: 0.15,
          }}
        />
      ))}
    </>
  );
}

function Stars() {
  const stars = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: 1 + Math.random() * 3,
        delay: `${Math.random() * 4}s`,
        duration: `${3 + Math.random() * 3}s`,
      })),
    [],
  );

  return (
    <>
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full animate-sparkle"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            backgroundColor: '#FFFFFF',
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </>
  );
}

function WaveLines({ color }: { color: string }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute left-0 w-full animate-wave opacity-10"
          style={{
            top: `${30 + i * 25}%`,
            height: 2,
            backgroundColor: color,
            animationDelay: `${i * 2}s`,
          }}
        />
      ))}
    </>
  );
}

export function AnimatedBackground({ theme }: AnimatedBackgroundProps) {
  const content = useMemo(() => {
    switch (theme) {
      case 'gradient':
        return <GlowOrbs color="#D12BF2" />;
      case 'neon':
        return (
          <>
            <GlowOrbs color="#EC4899" />
            <Particles count={8} color="#EC4899" />
          </>
        );
      case 'cosmic':
        return (
          <>
            <Stars />
            <GlowOrbs color="#7C3AED" />
          </>
        );
      case 'ocean':
        return (
          <>
            <WaveLines color="#20B2AA" />
            <Particles count={10} color="#0077B6" />
          </>
        );
      case 'sunset':
        return (
          <>
            <GlowOrbs color="#FF6347" />
            <Particles count={8} color="#FF69B4" />
          </>
        );
      case 'forest':
        return <Particles count={12} color="#50C878" />;
      case 'bold':
        return <GlowOrbs color="#FFFFFF" />;
      case 'elegant':
        return (
          <>
            <Particles count={6} color="#B8860B" />
            <GlowOrbs color="#DAA520" />
          </>
        );
      default:
        return <Particles count={10} color="#00E4F2" />;
    }
  }, [theme]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {content}
    </div>
  );
}
