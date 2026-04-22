/**
 * CinematicBackground — Global WebGL 3D scene shared across ALL pages.
 * Landing page, login, and all portals share this same persistent background.
 * Scroll-reactive particles, wireframe distort planets, sun, aurora.
 */

import { useEffect, useRef, useState, useMemo, Suspense, Component, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Stars } from '@react-three/drei';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════════ */
/*  SCROLL + MOUSE STATE                                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handler = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? Math.min(1, window.scrollY / h) : 0);
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return progress;
}

function useMousePosition() {
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return mouse;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  PARTICLE FIELD                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

function ParticleField({ scrollProgress, mouse }: {
  scrollProgress: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const count = 2000;
  const meshRef = useRef<THREE.Points>(null);

  const [positions, basePositions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 30;
      const y = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * 20 - 5;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      base[i * 3] = x; base[i * 3 + 1] = y; base[i * 3 + 2] = z;
    }
    return [pos, base];
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const posAttr = meshRef.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      posAttr.array[i * 3] = basePositions[i * 3] + Math.sin(t * 0.15 + i * 0.1) * 0.3 + mouse.current.x * 0.5;
      posAttr.array[i * 3 + 1] = basePositions[i * 3 + 1] + Math.cos(t * 0.12 + i * 0.15) * 0.2 - scrollProgress * 8 + mouse.current.y * 0.3;
      posAttr.array[i * 3 + 2] = basePositions[i * 3 + 2] + Math.sin(t * 0.1 + i * 0.05) * 0.2;
    }
    posAttr.needsUpdate = true;
    meshRef.current.rotation.y = t * 0.02 + scrollProgress * 0.5;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#00d4c8" transparent opacity={0.5} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  HERO ORB — Central wireframe distort sphere                           */
/* ═══════════════════════════════════════════════════════════════════════ */

function HeroOrb({ scrollProgress, mouse }: {
  scrollProgress: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.position.y = 0.5 - scrollProgress * 4;
    meshRef.current.position.x = mouse.current.x * 0.8;
    const s = Math.max(0.2, 1.3 - scrollProgress * 1.5);
    meshRef.current.scale.setScalar(s);
    meshRef.current.rotation.x = t * 0.15 + scrollProgress * 1.5;
    meshRef.current.rotation.z = t * 0.1;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.5, 12]} />
        <MeshDistortMaterial
          color="#00d4c8"
          emissive="#00d4c8"
          emissiveIntensity={0.3}
          roughness={0.2}
          metalness={0.8}
          distort={0.35}
          speed={2}
          transparent
          opacity={0.15}
          wireframe
        />
      </mesh>
    </Float>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  WIREFRAME PLANET — Same distort + wireframe style as hero orb         */
/* ═══════════════════════════════════════════════════════════════════════ */

interface PlanetConfig {
  position: [number, number, number];
  radius: number;
  color: string;
  emissive: string;
  speed: number;
  parallax: number;
  tilt: number;
  distort: number;
  distortSpeed: number;
  hasRing: boolean;
  ringColor?: string;
  detail: number;
  opacity: number;
}

function WireframePlanet({ config, scrollProgress, mouse }: {
  config: PlanetConfig;
  scrollProgress: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current || !meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Scroll parallax — planets drift with depth
    groupRef.current.position.y = config.position[1] - scrollProgress * 6 * config.parallax;
    groupRef.current.position.x = config.position[0] + mouse.current.x * 0.3 * config.parallax;

    // Self-rotation — continuous spin like the hero orb
    meshRef.current.rotation.y = t * config.speed;
    meshRef.current.rotation.x = config.tilt + t * config.speed * 0.3;
    meshRef.current.rotation.z = t * config.speed * 0.15;

    // Ring wobble
    if (ringRef.current) {
      ringRef.current.rotation.z = Math.sin(t * 0.5) * 0.08 + t * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={config.position}>
      <Float speed={0.6 + config.speed * 2} rotationIntensity={0.15} floatIntensity={0.3}>
        {/* Wireframe distort planet body — same style as hero orb */}
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[config.radius, config.detail]} />
          <MeshDistortMaterial
            color={config.color}
            emissive={config.emissive}
            emissiveIntensity={0.35}
            roughness={0.2}
            metalness={0.8}
            distort={config.distort}
            speed={config.distortSpeed}
            transparent
            opacity={config.opacity}
            wireframe
          />
        </mesh>

        {/* Inner glow sphere */}
        <mesh>
          <sphereGeometry args={[config.radius * 0.6, 16, 16]} />
          <meshBasicMaterial
            color={config.emissive}
            transparent
            opacity={0.04}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Atmosphere glow shell */}
        <mesh>
          <sphereGeometry args={[config.radius * 1.2, 16, 16]} />
          <meshBasicMaterial
            color={config.emissive}
            transparent
            opacity={0.03}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Ring (Saturn-style) */}
        {config.hasRing && (
          <mesh ref={ringRef} rotation={[Math.PI * 0.35, 0, 0]}>
            <ringGeometry args={[config.radius * 1.4, config.radius * 2.0, 48]} />
            <meshBasicMaterial
              color={config.ringColor || config.emissive}
              transparent
              opacity={0.12}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )}
      </Float>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  SUN — Bright, glowing, dominant light source                          */
/* ═══════════════════════════════════════════════════════════════════════ */

function Sun({ scrollProgress }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current || !meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Sun stays top-right, drifts slightly with scroll
    groupRef.current.position.y = 5 - scrollProgress * 3;

    // Slow rotation
    meshRef.current.rotation.y = t * 0.05;
    meshRef.current.rotation.x = t * 0.03;

    // Corona pulse
    if (coronaRef.current) {
      const pulse = 1 + Math.sin(t * 0.8) * 0.06;
      coronaRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef} position={[8, 5, -15]}>
      {/* Sun core — wireframe distort like planets */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 8]} />
        <MeshDistortMaterial
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.5}
          distort={0.25}
          speed={1.5}
          transparent
          opacity={0.25}
          wireframe
        />
      </mesh>

      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[0.8, 24, 24]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Corona — large outer glow */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[2.0, 24, 24]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Light rays */}
      <pointLight color="#f59e0b" intensity={0.8} distance={30} decay={2} />
      <pointLight color="#fbbf24" intensity={0.3} distance={15} decay={2} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  PLANET SYSTEM                                                         */
/* ═══════════════════════════════════════════════════════════════════════ */

function PlanetSystem({ scrollProgress, mouse }: {
  scrollProgress: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const planets: PlanetConfig[] = useMemo(() => [
    {
      position: [-5.5, 3.5, -8],
      radius: 0.55,
      color: '#0a4a40',
      emissive: '#00d4c8',
      speed: 0.15,
      parallax: 1.2,
      tilt: 0.3,
      distort: 0.3,
      distortSpeed: 1.8,
      hasRing: true,
      ringColor: '#00d4c8',
      detail: 8,
      opacity: 0.18,
    },
    {
      position: [5.5, -1.5, -10],
      radius: 0.7,
      color: '#2a1a4a',
      emissive: '#8b5cf6',
      speed: 0.08,
      parallax: 0.6,
      tilt: -0.2,
      distort: 0.25,
      distortSpeed: 1.5,
      hasRing: false,
      detail: 10,
      opacity: 0.15,
    },
    {
      position: [-3.5, -4, -5],
      radius: 0.35,
      color: '#4a3a0a',
      emissive: '#f59e0b',
      speed: 0.25,
      parallax: 1.5,
      tilt: 0.5,
      distort: 0.35,
      distortSpeed: 2.2,
      hasRing: true,
      ringColor: '#fbbf24',
      detail: 6,
      opacity: 0.2,
    },
    {
      position: [4.5, 4.5, -12],
      radius: 0.9,
      color: '#0a2a4a',
      emissive: '#38bdf8',
      speed: 0.06,
      parallax: 0.4,
      tilt: 0.15,
      distort: 0.2,
      distortSpeed: 1.2,
      hasRing: true,
      ringColor: '#7dd3fc',
      detail: 10,
      opacity: 0.12,
    },
    {
      position: [-6.5, -0.5, -7],
      radius: 0.25,
      color: '#0a4a1a',
      emissive: '#22c55e',
      speed: 0.35,
      parallax: 1.0,
      tilt: -0.4,
      distort: 0.4,
      distortSpeed: 2.5,
      hasRing: false,
      detail: 5,
      opacity: 0.22,
    },
    {
      position: [7, 2, -6],
      radius: 0.3,
      color: '#4a0a2a',
      emissive: '#f43f5e',
      speed: 0.2,
      parallax: 1.3,
      tilt: 0.6,
      distort: 0.35,
      distortSpeed: 2.0,
      hasRing: false,
      detail: 6,
      opacity: 0.2,
    },
  ], []);

  return (
    <>
      {planets.map((p, i) => (
        <WireframePlanet key={i} config={p} scrollProgress={scrollProgress} mouse={mouse} />
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  AURORA RIBBONS                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

function AuroraRibbons({ scrollProgress }: { scrollProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(25, 8, 128, 1), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const posAttr = meshRef.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      posAttr.setZ(i, Math.sin(x * 0.5 + t * 0.4 + scrollProgress * 3) * 1.5 + Math.sin(x * 0.3 - t * 0.2) * 0.8);
    }
    posAttr.needsUpdate = true;
    meshRef.current.position.y = 2 - scrollProgress * 10;
    meshRef.current.rotation.x = -0.3 - scrollProgress * 0.5;
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial color="#00d4c8" transparent opacity={0.04} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  CAMERA RIG                                                            */
/* ═══════════════════════════════════════════════════════════════════════ */

function CameraRig({ scrollProgress, mouse }: {
  scrollProgress: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const { camera } = useThree();
  useFrame(() => {
    const tx = mouse.current.x * 0.5;
    const ty = mouse.current.y * 0.3 + 1 - scrollProgress * 2;
    const tz = 6 - scrollProgress * 2;
    camera.position.x += (tx - camera.position.x) * 0.03;
    camera.position.y += (ty - camera.position.y) * 0.03;
    camera.position.z += (tz - camera.position.z) * 0.03;
    camera.lookAt(0, -scrollProgress * 2, -5);
  });
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  SCENE CONTENT                                                         */
/* ═══════════════════════════════════════════════════════════════════════ */

function SceneContent({ scrollProgress, mouse }: {
  scrollProgress: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  return (
    <>
      <CameraRig scrollProgress={scrollProgress} mouse={mouse} />
      <ambientLight intensity={0.12} />
      <directionalLight position={[5, 5, 5]} intensity={0.2} color="#00d4c8" />
      <pointLight position={[-5, 3, -3]} intensity={0.4} color="#38bdf8" distance={15} decay={2} />
      <pointLight position={[3, -2, -5]} intensity={0.25} color="#8b5cf6" distance={12} decay={2} />
      <Stars radius={50} depth={40} count={3000} factor={3} saturation={0.2} fade speed={0.5} />
      <ParticleField scrollProgress={scrollProgress} mouse={mouse} />
      <HeroOrb scrollProgress={scrollProgress} mouse={mouse} />
      <PlanetSystem scrollProgress={scrollProgress} mouse={mouse} />
      <Sun scrollProgress={scrollProgress} />
      <AuroraRibbons scrollProgress={scrollProgress} />
      <fog attach="fog" args={['#040612', 5, 25]} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  2D OVERLAYS                                                           */
/* ═══════════════════════════════════════════════════════════════════════ */

function Overlays({ scrollProgress }: { scrollProgress: number }) {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,${0.4 + scrollProgress * 0.3}) 100%)` }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 0%, transparent 70%, rgba(4,6,18,0.5) 100%)' }} />
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay" style={{ opacity: 0.03 + scrollProgress * 0.02, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`, backgroundSize: '128px 128px' }} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  CSS FALLBACK                                                          */
/* ═══════════════════════════════════════════════════════════════════════ */

function CSSFallbackBackground() {
  return (
    <>
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(59,130,246,0.06) 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.04) 0%, transparent 50%), #040612` }} />
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  ERROR BOUNDARY                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

class WebGLErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.warn('[CinematicBG] WebGL error:', error.message); }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function isWebGLAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                         MAIN COMPONENT                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function CinematicBackground() {
  const scrollProgress = useScrollProgress();
  const mouse = useMousePosition();
  const [webglSupported] = useState(() => isWebGLAvailable());

  return (
    <div className="fixed inset-0 -z-10" style={{ background: '#040612' }}>
      {webglSupported ? (
        <WebGLErrorBoundary fallback={<CSSFallbackBackground />}>
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 1, 6], fov: 60, near: 0.1, far: 100 }}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <Suspense fallback={null}>
              <SceneContent scrollProgress={scrollProgress} mouse={mouse} />
            </Suspense>
          </Canvas>
        </WebGLErrorBoundary>
      ) : (
        <CSSFallbackBackground />
      )}
      <Overlays scrollProgress={scrollProgress} />
    </div>
  );
}
