import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/* ─── Depth zone definitions ─────────────────────────────────────────── */
const DEPTH_ZONES = [
  { name: 'surface',   from: 0,   to: 0.15, bg: 'rgba(0,70,130,1)',    light: 0.9 },
  { name: 'shallow',   from: 0.15, to: 0.35, bg: 'rgba(0,45,100,1)',    light: 0.6 },
  { name: 'mid',       from: 0.35, to: 0.55, bg: 'rgba(0,25,70,1)',     light: 0.35 },
  { name: 'deep',      from: 0.55, to: 0.75, bg: 'rgba(0,12,45,1)',     light: 0.15 },
  { name: 'abyss',     from: 0.75, to: 1.0,  bg: 'rgba(2,4,18,1)',      light: 0.04 },
];

/* ─── Bubble system ──────────────────────────────────────────────────── */
interface Bubble {
  id: number; x: number; size: number; speed: number; wobble: number; delay: number; opacity: number;
}

function generateBubbles(count: number): Bubble[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: 2 + Math.random() * 8,
    speed: 8 + Math.random() * 16,
    wobble: 10 + Math.random() * 20,
    delay: Math.random() * 12,
    opacity: 0.15 + Math.random() * 0.35,
  }));
}

/* ─── Marine creature SVGs ───────────────────────────────────────────── */
const Fish = ({ flip, color = '#4fd1c5' }: { flip?: boolean; color?: string }) => (
  <svg width="40" height="20" viewBox="0 0 40 20" fill="none" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
    <ellipse cx="22" cy="10" rx="14" ry="7" fill={color} opacity="0.7" />
    <polygon points="6,10 0,3 0,17" fill={color} opacity="0.6" />
    <circle cx="30" cy="8" r="1.5" fill="white" opacity="0.9" />
  </svg>
);

const TropicalFish = ({ flip, color = '#f6ad55' }: { flip?: boolean; color?: string }) => (
  <svg width="44" height="24" viewBox="0 0 44 24" fill="none" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
    <ellipse cx="24" cy="12" rx="16" ry="9" fill={color} opacity="0.7" />
    <polygon points="6,12 0,4 0,20" fill={color} opacity="0.5" />
    <ellipse cx="24" cy="12" rx="12" ry="6" fill="white" opacity="0.08" />
    <line x1="18" y1="5" x2="18" y2="19" stroke="white" strokeWidth="0.5" opacity="0.2" />
    <line x1="28" y1="5" x2="28" y2="19" stroke="white" strokeWidth="0.5" opacity="0.2" />
    <circle cx="34" cy="10" r="1.8" fill="white" opacity="0.9" />
    <circle cx="34" cy="10" r="0.8" fill="#1a202c" />
  </svg>
);

const Jellyfish = ({ color = '#e9d5ff' }: { color?: string }) => (
  <svg width="30" height="50" viewBox="0 0 30 50" fill="none">
    <ellipse cx="15" cy="12" rx="13" ry="11" fill={color} opacity="0.35" />
    <ellipse cx="15" cy="12" rx="9" ry="7" fill={color} opacity="0.15" />
    {[6, 11, 15, 19, 24].map((x, i) => (
      <path key={i} d={`M${x},22 Q${x + (i % 2 ? 2 : -2)},34 ${x},48`} stroke={color} strokeWidth="1" opacity="0.3" fill="none" />
    ))}
  </svg>
);

const SeaTurtle = ({ flip }: { flip?: boolean }) => (
  <svg width="56" height="36" viewBox="0 0 56 36" fill="none" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
    <ellipse cx="28" cy="18" rx="16" ry="12" fill="#2d8659" opacity="0.5" />
    <ellipse cx="28" cy="18" rx="12" ry="8" fill="#38a169" opacity="0.3" />
    <ellipse cx="42" cy="14" r="4" fill="#276749" opacity="0.45" />
    <circle cx="44" cy="13" r="1" fill="white" opacity="0.8" />
    {/* Flippers */}
    <ellipse cx="18" cy="8" rx="8" ry="3" fill="#2d8659" opacity="0.4" transform="rotate(-25 18 8)" />
    <ellipse cx="18" cy="28" rx="8" ry="3" fill="#2d8659" opacity="0.4" transform="rotate(25 18 28)" />
    <ellipse cx="38" cy="8" rx="6" ry="2.5" fill="#2d8659" opacity="0.4" transform="rotate(-15 38 8)" />
    <ellipse cx="38" cy="28" rx="6" ry="2.5" fill="#2d8659" opacity="0.4" transform="rotate(15 38 28)" />
  </svg>
);

const MantaRay = ({ flip }: { flip?: boolean }) => (
  <svg width="80" height="40" viewBox="0 0 80 40" fill="none" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
    <path d="M40,20 Q10,0 0,18 Q10,22 40,20 Z" fill="#4a5568" opacity="0.35" />
    <path d="M40,20 Q10,40 0,22 Q10,18 40,20 Z" fill="#4a5568" opacity="0.3" />
    <path d="M40,20 Q70,0 80,18 Q70,22 40,20 Z" fill="#4a5568" opacity="0.35" />
    <path d="M40,20 Q70,40 80,22 Q70,18 40,20 Z" fill="#4a5568" opacity="0.3" />
    <ellipse cx="40" cy="20" rx="8" ry="5" fill="#4a5568" opacity="0.4" />
    <circle cx="32" cy="18" r="1.2" fill="white" opacity="0.6" />
    <circle cx="48" cy="18" r="1.2" fill="white" opacity="0.6" />
  </svg>
);

const Whale = ({ flip }: { flip?: boolean }) => (
  <svg width="120" height="50" viewBox="0 0 120 50" fill="none" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
    <ellipse cx="60" cy="25" rx="45" ry="18" fill="#2d3748" opacity="0.35" />
    <ellipse cx="60" cy="22" rx="35" ry="12" fill="#4a5568" opacity="0.15" />
    <path d="M15,25 Q0,10 5,0 Q8,12 15,25 Z" fill="#2d3748" opacity="0.3" />
    <path d="M15,25 Q0,40 5,50 Q8,38 15,25 Z" fill="#2d3748" opacity="0.3" />
    <circle cx="95" cy="20" r="2.5" fill="white" opacity="0.5" />
    <circle cx="95" cy="20" r="1" fill="#1a202c" opacity="0.7" />
    <ellipse cx="60" cy="32" rx="20" ry="2" fill="white" opacity="0.06" />
  </svg>
);

/* ─── Creature layer data ────────────────────────────────────────────── */
interface Creature {
  id: string;
  Component: React.FC<any>;
  props: Record<string, any>;
  x: number;         // % from left
  depthStart: number; // scroll progress 0-1 where it appears
  depthEnd: number;   // scroll progress 0-1 where it disappears
  y: number;          // vertical offset within its zone (px)
  speed: number;      // horizontal drift speed (s per full cycle)
  drift: number;      // horizontal drift distance (px)
}

const CREATURES: Creature[] = [
  // Surface - small fish schools
  { id: 'f1', Component: Fish, props: { color: '#63b3ed' }, x: 15, depthStart: 0, depthEnd: 0.25, y: 80, speed: 18, drift: 120 },
  { id: 'f2', Component: Fish, props: { color: '#4fd1c5', flip: true }, x: 70, depthStart: 0, depthEnd: 0.2, y: 140, speed: 22, drift: 100 },
  { id: 'f3', Component: Fish, props: { color: '#90cdf4' }, x: 40, depthStart: 0.05, depthEnd: 0.25, y: 60, speed: 15, drift: 140 },
  // Shallow - tropical fish + turtles
  { id: 'tf1', Component: TropicalFish, props: { color: '#f6ad55' }, x: 25, depthStart: 0.12, depthEnd: 0.45, y: 100, speed: 20, drift: 110 },
  { id: 'tf2', Component: TropicalFish, props: { color: '#fc8181', flip: true }, x: 65, depthStart: 0.18, depthEnd: 0.4, y: 180, speed: 25, drift: 90 },
  { id: 'st1', Component: SeaTurtle, props: {}, x: 50, depthStart: 0.2, depthEnd: 0.5, y: 150, speed: 30, drift: 80 },
  { id: 'tf3', Component: TropicalFish, props: { color: '#fbd38d', flip: true }, x: 10, depthStart: 0.25, depthEnd: 0.5, y: 120, speed: 18, drift: 130 },
  // Mid - larger fish, rays
  { id: 'mr1', Component: MantaRay, props: {}, x: 35, depthStart: 0.4, depthEnd: 0.65, y: 100, speed: 35, drift: 150 },
  { id: 'tf4', Component: TropicalFish, props: { color: '#b794f4' }, x: 80, depthStart: 0.35, depthEnd: 0.6, y: 200, speed: 22, drift: 100 },
  { id: 'st2', Component: SeaTurtle, props: { flip: true }, x: 20, depthStart: 0.38, depthEnd: 0.58, y: 160, speed: 28, drift: 90 },
  // Deep - jellyfish
  { id: 'j1', Component: Jellyfish, props: { color: '#e9d5ff' }, x: 30, depthStart: 0.5, depthEnd: 0.8, y: 80, speed: 12, drift: 40 },
  { id: 'j2', Component: Jellyfish, props: { color: '#c4b5fd' }, x: 65, depthStart: 0.55, depthEnd: 0.85, y: 140, speed: 14, drift: 50 },
  { id: 'j3', Component: Jellyfish, props: { color: '#a78bfa' }, x: 45, depthStart: 0.58, depthEnd: 0.82, y: 200, speed: 16, drift: 35 },
  { id: 'mr2', Component: MantaRay, props: { flip: true }, x: 75, depthStart: 0.52, depthEnd: 0.72, y: 120, speed: 32, drift: 120 },
  // Abyss - whales + bioluminescent jellyfish
  { id: 'w1', Component: Whale, props: {}, x: 40, depthStart: 0.72, depthEnd: 0.95, y: 120, speed: 45, drift: 200 },
  { id: 'j4', Component: Jellyfish, props: { color: '#00ffcc' }, x: 20, depthStart: 0.78, depthEnd: 1.0, y: 80, speed: 10, drift: 30 },
  { id: 'j5', Component: Jellyfish, props: { color: '#00e5ff' }, x: 80, depthStart: 0.8, depthEnd: 1.0, y: 180, speed: 13, drift: 45 },
  { id: 'w2', Component: Whale, props: { flip: true }, x: 60, depthStart: 0.85, depthEnd: 1.0, y: 200, speed: 50, drift: 180 },
];

/* ─── Sunlight rays (top only) ───────────────────────────────────────── */
function SunlightRays({ opacity }: { opacity: number }) {
  if (opacity < 0.05) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      {[15, 30, 50, 70, 85].map((x, i) => (
        <div
          key={i}
          className="absolute top-0"
          style={{
            left: `${x}%`,
            width: `${3 + i * 0.5}%`,
            height: '60%',
            background: `linear-gradient(180deg, rgba(255,255,200,${0.08 + i * 0.01}) 0%, transparent 100%)`,
            transform: `rotate(${-8 + i * 4}deg)`,
            transformOrigin: 'top center',
            filter: 'blur(8px)',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Bioluminescent particles (deep only) ───────────────────────────── */
function BioLumParticles({ opacity }: { opacity: number }) {
  if (opacity < 0.05) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      {Array.from({ length: 20 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: 2 + Math.random() * 4,
            height: 2 + Math.random() * 4,
            background: `radial-gradient(circle, ${
              ['#00ffcc', '#00e5ff', '#7c3aed', '#a78bfa'][i % 4]
            } 0%, transparent 70%)`,
          }}
          animate={{
            opacity: [0.1, 0.6, 0.1],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */
export default function UnderwaterBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [bubbles] = useState(() => generateBubbles(30));

  // Track scroll progress
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

  // Compute depth-based colors
  const depthColor = (() => {
    const p = scrollProgress;
    // Surface to abyss gradient
    const r = Math.round(0 + p * 2);
    const g = Math.round(70 - p * 66);
    const b = Math.round(130 - p * 112);
    return `rgb(${Math.max(0, r)}, ${Math.max(0, g)}, ${Math.max(0, b)})`;
  })();

  const sunlightOpacity = Math.max(0, 1 - scrollProgress * 4);
  const bioLumOpacity = Math.max(0, (scrollProgress - 0.65) * 3);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 transition-colors duration-700"
      style={{ backgroundColor: depthColor }}
    >
      {/* Sunlight rays at the surface */}
      <SunlightRays opacity={sunlightOpacity} />

      {/* Bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {bubbles.map(b => (
          <div
            key={b.id}
            className="absolute rounded-full border border-white/20"
            style={{
              left: `${b.x}%`,
              width: b.size,
              height: b.size,
              opacity: b.opacity * (0.5 + scrollProgress * 0.5),
              animation: `bubbleRise ${b.speed}s linear ${b.delay}s infinite, bubbleWobble ${b.speed * 0.4}s ease-in-out ${b.delay}s infinite alternate`,
              background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), transparent)`,
            }}
          />
        ))}
      </div>

      {/* Creatures */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {CREATURES.map(c => {
          const visible = scrollProgress >= c.depthStart && scrollProgress <= c.depthEnd;
          const zoneProgress = (scrollProgress - c.depthStart) / (c.depthEnd - c.depthStart);
          const fadeIn = Math.min(1, zoneProgress * 5);
          const fadeOut = Math.min(1, (1 - zoneProgress) * 5);
          const opacity = visible ? Math.min(fadeIn, fadeOut) : 0;

          if (opacity < 0.01) return null;

          return (
            <motion.div
              key={c.id}
              className="absolute"
              style={{
                left: `${c.x}%`,
                top: c.y,
                opacity,
                transition: 'opacity 0.5s ease',
              }}
              animate={{
                x: [0, c.drift, 0, -c.drift * 0.5, 0],
                y: [0, -8, 0, 8, 0],
              }}
              transition={{
                duration: c.speed,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <c.Component {...c.props} />
            </motion.div>
          );
        })}
      </div>

      {/* Bioluminescent particles in the abyss */}
      <BioLumParticles opacity={bioLumOpacity} />

      {/* Depth gradient overlay — subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,${0.2 + scrollProgress * 0.3}) 100%)`,
        }}
      />

      {/* CSS keyframes */}
      <style>{`
        @keyframes bubbleRise {
          0%   { transform: translateY(100vh); }
          100% { transform: translateY(-20px); }
        }
        @keyframes bubbleWobble {
          0%   { margin-left: 0; }
          100% { margin-left: 15px; }
        }
      `}</style>
    </div>
  );
}
