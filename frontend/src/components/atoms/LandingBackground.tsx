import { useMemo, useEffect, useState } from 'react';

/**
 * Premium animated background with scroll parallax.
 * Blue/Indigo/Violet radial gradients with slow drift + pulse.
 * Orbs move at different parallax speeds based on scroll position.
 * Respects prefers-reduced-motion via CSS (animations disabled).
 */
export function LandingBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const orbs = useMemo(
    () => [
      { x: '15%', y: '15%', size: 520, color: '#2563EB', animation: 'animate-pulse-glow', delay: 0, dur: 18, parallax: 0.03 },
      { x: '72%', y: '10%', size: 440, color: '#7C3AED', animation: 'animate-glow-drift', delay: 3, dur: 20, parallax: 0.05 },
      { x: '50%', y: '50%', size: 600, color: '#4F46E5', animation: 'animate-pulse-glow', delay: 6, dur: 22, parallax: 0.02 },
      { x: '85%', y: '60%', size: 380, color: '#7C3AED', animation: 'animate-glow-drift', delay: 9, dur: 19, parallax: 0.06 },
      { x: '20%', y: '75%', size: 350, color: '#2563EB', animation: 'animate-glow-drift', delay: 4, dur: 21, parallax: 0.04 },
    ],
    [],
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-[#020617]" />
      <div className="absolute inset-0 opacity-[0.025] noise-texture" />

      {orbs.map((orb, i) => (
        <div
          key={i}
          className={`absolute rounded-full ${orb.animation}`}
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color}18 0%, transparent 70%)`,
            filter: 'blur(90px)',
            animationDelay: `${orb.delay}s`,
            animationDuration: `${orb.dur}s`,
            transform: `translate(-50%, calc(-50% + ${scrollY * orb.parallax}px))`,
          }}
        />
      ))}

      <div className="absolute inset-0 rain-bg" />
      <div className="absolute inset-0 vignette-dark" />
    </div>
  );
}
