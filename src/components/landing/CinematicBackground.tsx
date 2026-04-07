/**
 * CinematicBackground — Scroll-reactive cinematic backdrop.
 * Dramatic gradient shifts, aurora lights, floating orbs, film grain.
 * Replaces the old underwater theme with a premium dark aesthetic.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

/* ─── Scroll-reactive gradient zones ─────────────────────────────────── */
interface Zone {
  at: number;                 // scroll progress 0-1
  bg: [number, number, number]; // RGB
  accent: string;             // CSS color for accent glow
  grain: number;              // grain intensity 0-1
}

const ZONES: Zone[] = [
  { at: 0,    bg: [4, 6, 18],    accent: 'rgba(0,212,200,0.12)',  grain: 0.03 },
  { at: 0.15, bg: [3, 8, 22],    accent: 'rgba(0,212,200,0.18)',  grain: 0.04 },
  { at: 0.30, bg: [2, 10, 28],   accent: 'rgba(56,189,248,0.15)', grain: 0.04 },
  { at: 0.50, bg: [4, 6, 24],    accent: 'rgba(99,102,241,0.12)', grain: 0.05 },
  { at: 0.70, bg: [6, 4, 22],    accent: 'rgba(139,92,246,0.14)', grain: 0.05 },
  { at: 0.85, bg: [3, 5, 16],    accent: 'rgba(0,212,200,0.16)',  grain: 0.04 },
  { at: 1.0,  bg: [2, 3, 10],    accent: 'rgba(0,212,200,0.10)',  grain: 0.03 },
];

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function getZoneValues(progress: number) {
  let i = 0;
  for (; i < ZONES.length - 1; i++) {
    if (progress <= ZONES[i + 1].at) break;
  }
  const zone = ZONES[i];
  const next = ZONES[Math.min(i + 1, ZONES.length - 1)];
  const t = zone.at === next.at ? 0 : (progress - zone.at) / (next.at - zone.at);
  const bg = lerpColor(zone.bg, next.bg, t);
  return { bg, accent: t < 0.5 ? zone.accent : next.accent, grain: zone.grain + (next.grain - zone.grain) * t };
}

/* ─── Aurora light effect ────────────────────────────────────────────── */
function AuroraLights({ scrollProgress }: { scrollProgress: number }) {
  const opacity = 0.5 + Math.sin(scrollProgress * Math.PI) * 0.5;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      {/* Primary aurora sweep */}
      <motion.div
        className="absolute"
        style={{
          width: '140%',
          height: '50%',
          left: '-20%',
          top: '10%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(0,212,200,0.06) 0%, rgba(0,212,200,0.02) 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, 60, -30, 0],
          y: [0, -20, 10, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Secondary accent light */}
      <motion.div
        className="absolute"
        style={{
          width: '60%',
          height: '40%',
          right: '-10%',
          top: '20%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(56,189,248,0.05) 0%, transparent 60%)',
          filter: 'blur(100px)',
        }}
        animate={{
          x: [0, -40, 20, 0],
          y: [0, 30, -15, 0],
          opacity: [0.3, 0.7, 0.4, 0.3],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Deep purple accent (appears in mid-scroll) */}
      <motion.div
        className="absolute"
        style={{
          width: '50%',
          height: '50%',
          left: '10%',
          bottom: '5%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.04) 0%, transparent 60%)',
          filter: 'blur(90px)',
          opacity: Math.max(0, (scrollProgress - 0.3) * 2),
        }}
        animate={{
          x: [0, 30, -20, 0],
          scale: [1, 1.15, 1, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

/* ─── Floating geometric shapes ──────────────────────────────────────── */
function FloatingShapes({ scrollProgress }: { scrollProgress: number }) {
  const shapes = useMemo(() => [
    { x: 15, y: 20, size: 200, rotation: 45, speed: 30, color: 'rgba(0,212,200,0.03)' },
    { x: 75, y: 35, size: 160, rotation: -30, speed: 25, color: 'rgba(56,189,248,0.025)' },
    { x: 50, y: 60, size: 280, rotation: 15, speed: 35, color: 'rgba(99,102,241,0.02)' },
    { x: 85, y: 75, size: 120, rotation: -60, speed: 22, color: 'rgba(0,212,200,0.025)' },
    { x: 25, y: 80, size: 180, rotation: 30, speed: 28, color: 'rgba(139,92,246,0.02)' },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: s.size,
            height: s.size,
            left: `${s.x}%`,
            top: `${s.y}%`,
            background: `radial-gradient(circle, ${s.color}, transparent 70%)`,
            transform: `translate(-50%, -50%) translateY(${scrollProgress * -100 * (i % 2 === 0 ? 1 : -0.5)}px)`,
            filter: 'blur(40px)',
          }}
          animate={{
            rotate: [s.rotation, s.rotation + 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: s.speed * 2, repeat: Infinity, ease: 'linear' },
            scale: { duration: s.speed, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      ))}
    </div>
  );
}

/* ─── Subtle grid / dot pattern ──────────────────────────────────────── */
function GridPattern({ opacity }: { opacity: number }) {
  if (opacity < 0.01) return null;
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity: opacity * 0.4,
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)`,
        backgroundSize: '48px 48px',
      }}
    />
  );
}

/* ─── Film grain overlay ─────────────────────────────────────────────── */
function FilmGrain({ intensity }: { intensity: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none mix-blend-overlay"
      style={{
        opacity: intensity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: '128px 128px',
      }}
    />
  );
}

/* ─── Edge vignette ──────────────────────────────────────────────────── */
function Vignette({ intensity }: { intensity: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,${0.3 + intensity * 0.3}) 100%)`,
      }}
    />
  );
}

/* ─── Horizontal light beam (hero only) ──────────────────────────────── */
function HeroBeam({ opacity }: { opacity: number }) {
  if (opacity < 0.02) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      <div
        className="absolute"
        style={{
          width: '100%',
          height: '1px',
          top: '50%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,200,0.15) 30%, rgba(0,212,200,0.3) 50%, rgba(0,212,200,0.15) 70%, transparent 100%)',
          boxShadow: '0 0 60px 30px rgba(0,212,200,0.04)',
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                         MAIN COMPONENT                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function CinematicBackground() {
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    setScrollProgress(docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const { bg, grain } = getZoneValues(scrollProgress);
  const bgColor = `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`;
  const heroBeamOpacity = Math.max(0, 1 - scrollProgress * 4);
  const gridOpacity = 0.3 + Math.sin(scrollProgress * Math.PI * 2) * 0.2;

  return (
    <div
      className="fixed inset-0 -z-10"
      style={{
        backgroundColor: bgColor,
        transition: 'background-color 0.6s ease',
      }}
    >
      {/* Aurora light effects */}
      <AuroraLights scrollProgress={scrollProgress} />

      {/* Floating geometric shapes with parallax */}
      <FloatingShapes scrollProgress={scrollProgress} />

      {/* Subtle dot grid */}
      <GridPattern opacity={gridOpacity} />

      {/* Hero horizontal beam */}
      <HeroBeam opacity={heroBeamOpacity} />

      {/* Film grain texture */}
      <FilmGrain intensity={grain} />

      {/* Edge vignette */}
      <Vignette intensity={scrollProgress} />
    </div>
  );
}
