/**
 * CinematicBackground — Real WebGL 3D scene with React Three Fiber.
 * Scroll-reactive 3D particle field, cartoon planets, aurora glow.
 * Inspired by akari.lusion.co — immersive, interactive, cinematic.
 */

import { useEffect, useRef, useState, useMemo, Suspense, Component, type ReactNode, type ErrorInfo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Stars } from '@react-three/drei';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════════ */
/*  SCROLL + MOUSE STATE (shared across 3D components)                    */
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
/*  PARTICLE FIELD — Thousands of floating points that react to scroll    */
/* ═══════════════════════════════════════════════════════════════════════ */

function ParticleField({ scrollProgress, mouse }: {
  scrollProgress: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const count = 2000;
  const meshRef = useRef<THREE.Points>(null);

  const [positions, sizes, basePositions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const base = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 30;
      const y = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * 20 - 5;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      base[i * 3] = x;
      base[i * 3 + 1] = y;
      base[i * 3 + 2] = z;
      sz[i] = Math.random() * 2 + 0.5;
    }
    return [pos, sz, base];
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const geo = meshRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];
      posAttr.array[i * 3] = bx + Math.sin(t * 0.15 + i * 0.1) * 0.3 + mouse.current.x * 0.5;
      posAttr.array[i * 3 + 1] = by + Math.cos(t * 0.12 + i * 0.15) * 0.2 - scrollProgress * 8 + mouse.current.y * 0.3;
      posAttr.array[i * 3 + 2] = bz + Math.sin(t * 0.1 + i * 0.05) * 0.2;
    }
    posAttr.needsUpdate = true;
    meshRef.current.rotation.y = t * 0.02 + scrollProgress * 0.5;
    meshRef.current.rotation.x = scrollProgress * 0.3;
  });

  const color = useMemo(() => {
    const c = new THREE.Color();
    c.setHSL(0.49 - scrollProgress * 0.15, 0.8, 0.6);
    return c;
  }, [scrollProgress]);

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color={color} transparent opacity={0.6} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  HERO ORB — Central glowing distorted sphere                           */
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
/*  CARTOON PLANET — Stylized planet with oversized surface features       */
/* ═══════════════════════════════════════════════════════════════════════ */

interface PlanetConfig {
  position: [number, number, number];
  radius: number;
  color: string;
  emissive: string;
  speed: number;
  parallax: number;
  tilt: number;
  hasRing: boolean;
  ringColor?: string;
  craterCount: number;
  glowIntensity: number;
}

function CartoonPlanet({ config, scrollProgress, mouse }: {
  config: PlanetConfig;
  scrollProgress: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  // Generate craters as bump-like geometry
  const craters = useMemo(() => {
    const arr: { pos: THREE.Vector3; scale: number }[] = [];
    for (let i = 0; i < config.craterCount; i++) {
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      const r = config.radius;
      arr.push({
        pos: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        ),
        // Oversized craters — key to the cartoonish look
        scale: 0.08 + Math.random() * 0.15,
      });
    }
    return arr;
  }, [config.radius, config.craterCount]);

  // Mountains / surface bumps
  const mountains = useMemo(() => {
    const arr: { pos: THREE.Vector3; scale: number; height: number }[] = [];
    const mountainCount = Math.floor(config.craterCount * 0.6);
    for (let i = 0; i < mountainCount; i++) {
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      const r = config.radius;
      arr.push({
        pos: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        ),
        scale: 0.06 + Math.random() * 0.12,
        height: 0.08 + Math.random() * 0.15,
      });
    }
    return arr;
  }, [config.radius, config.craterCount]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Scroll parallax
    groupRef.current.position.y = config.position[1] - scrollProgress * 6 * config.parallax;
    groupRef.current.position.x = config.position[0] + mouse.current.x * 0.3 * config.parallax;

    // Self-rotation
    if (planetRef.current) {
      planetRef.current.rotation.y = t * config.speed;
      planetRef.current.rotation.x = config.tilt;
    }

    // Ring wobble
    if (ringRef.current) {
      ringRef.current.rotation.z = Math.sin(t * 0.5) * 0.05;
    }

    // Atmosphere pulse
    if (atmosphereRef.current) {
      const pulse = 1 + Math.sin(t * 1.5) * 0.03;
      atmosphereRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef} position={config.position}>
      <Float speed={0.8 + config.speed} rotationIntensity={0.1} floatIntensity={0.3}>
        {/* Planet body */}
        <mesh ref={planetRef}>
          <sphereGeometry args={[config.radius, 32, 32]} />
          <meshStandardMaterial
            color={config.color}
            emissive={config.emissive}
            emissiveIntensity={config.glowIntensity}
            roughness={0.6}
            metalness={0.2}
          />
        </mesh>

        {/* Oversized craters — dark indentations on surface */}
        {craters.map((crater, i) => (
          <mesh
            key={`crater-${i}`}
            position={crater.pos}
            lookAt={new THREE.Vector3(0, 0, 0)}
          >
            <sphereGeometry args={[crater.scale, 12, 12]} />
            <meshStandardMaterial
              color="#000000"
              transparent
              opacity={0.4}
              roughness={0.9}
            />
          </mesh>
        ))}

        {/* Oversized mountains / bumps */}
        {mountains.map((mt, i) => {
          const normal = mt.pos.clone().normalize();
          return (
            <mesh
              key={`mt-${i}`}
              position={[
                mt.pos.x + normal.x * mt.height * 0.5,
                mt.pos.y + normal.y * mt.height * 0.5,
                mt.pos.z + normal.z * mt.height * 0.5,
              ]}
            >
              <coneGeometry args={[mt.scale, mt.height, 6]} />
              <meshStandardMaterial
                color={config.color}
                emissive={config.emissive}
                emissiveIntensity={config.glowIntensity * 1.3}
                roughness={0.5}
                metalness={0.3}
              />
            </mesh>
          );
        })}

        {/* Atmosphere glow shell */}
        <mesh ref={atmosphereRef}>
          <sphereGeometry args={[config.radius * 1.15, 24, 24]} />
          <meshBasicMaterial
            color={config.emissive}
            transparent
            opacity={0.06}
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
              opacity={0.18}
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
/*  PLANET SYSTEM — All cartoon planets composed together                  */
/* ═══════════════════════════════════════════════════════════════════════ */

function PlanetSystem({ scrollProgress, mouse }: {
  scrollProgress: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const planets: PlanetConfig[] = useMemo(() => [
    {
      position: [-5.5, 3.5, -8],
      radius: 0.55,
      color: '#1a6b5a',
      emissive: '#00d4c8',
      speed: 0.15,
      parallax: 1.2,
      tilt: 0.3,
      hasRing: true,
      ringColor: '#00d4c8',
      craterCount: 8,
      glowIntensity: 0.4,
    },
    {
      position: [5.5, -1.5, -10],
      radius: 0.7,
      color: '#4a2a6b',
      emissive: '#8b5cf6',
      speed: 0.08,
      parallax: 0.6,
      tilt: -0.2,
      hasRing: false,
      craterCount: 12,
      glowIntensity: 0.35,
    },
    {
      position: [-3.5, -4, -5],
      radius: 0.35,
      color: '#6b4a1a',
      emissive: '#f59e0b',
      speed: 0.25,
      parallax: 1.5,
      tilt: 0.5,
      hasRing: true,
      ringColor: '#fbbf24',
      craterCount: 6,
      glowIntensity: 0.5,
    },
    {
      position: [4.5, 4.5, -12],
      radius: 0.9,
      color: '#1a3a6b',
      emissive: '#38bdf8',
      speed: 0.06,
      parallax: 0.4,
      tilt: 0.15,
      hasRing: true,
      ringColor: '#7dd3fc',
      craterCount: 15,
      glowIntensity: 0.3,
    },
    {
      position: [-6.5, -0.5, -7],
      radius: 0.25,
      color: '#2a6b3a',
      emissive: '#22c55e',
      speed: 0.35,
      parallax: 1.0,
      tilt: -0.4,
      hasRing: false,
      craterCount: 4,
      glowIntensity: 0.6,
    },
    {
      position: [7, 2, -6],
      radius: 0.3,
      color: '#6b1a3a',
      emissive: '#f43f5e',
      speed: 0.2,
      parallax: 1.3,
      tilt: 0.6,
      hasRing: false,
      craterCount: 5,
      glowIntensity: 0.45,
    },
  ], []);

  return (
    <>
      {planets.map((p, i) => (
        <CartoonPlanet key={i} config={p} scrollProgress={scrollProgress} mouse={mouse} />
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  AURORA RIBBONS — Glowing light bands that shift with scroll           */
/* ═══════════════════════════════════════════════════════════════════════ */

function AuroraRibbons({ scrollProgress }: { scrollProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(25, 8, 128, 1);
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const posAttr = meshRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const count = posAttr.count;
    for (let i = 0; i < count; i++) {
      const x = posAttr.getX(i);
      const wave = Math.sin(x * 0.5 + t * 0.4 + scrollProgress * 3) * 1.5
        + Math.sin(x * 0.3 - t * 0.2) * 0.8;
      posAttr.setZ(i, wave);
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
/*  LIGHT BEAMS — Volumetric-style rays                                   */
/* ═══════════════════════════════════════════════════════════════════════ */

function LightBeams({ scrollProgress }: { scrollProgress: number }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.z = t * 0.02;
    group.current.position.y = -scrollProgress * 3;
    const o = Math.max(0, 0.8 - scrollProgress * 2);
    group.current.children.forEach(c => {
      if ((c as THREE.Mesh).material) {
        ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = o * 0.06;
      }
    });
  });

  return (
    <group ref={group} position={[0, 0, -8]}>
      {[...Array(5)].map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const x = Math.cos(angle) * 3;
        const y = Math.sin(angle) * 3;
        return (
          <mesh key={i} position={[x, y, 0]} rotation={[0, 0, angle]}>
            <planeGeometry args={[0.15, 20]} />
            <meshBasicMaterial color="#00d4c8" transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  CAMERA RIG — Smooth scroll-driven camera movement                     */
/* ═══════════════════════════════════════════════════════════════════════ */

function CameraRig({ scrollProgress, mouse }: {
  scrollProgress: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const { camera } = useThree();

  useFrame(() => {
    const targetX = mouse.current.x * 0.5;
    const targetY = mouse.current.y * 0.3 + 1 - scrollProgress * 2;
    const targetZ = 6 - scrollProgress * 2;
    camera.position.x += (targetX - camera.position.x) * 0.03;
    camera.position.y += (targetY - camera.position.y) * 0.03;
    camera.position.z += (targetZ - camera.position.z) * 0.03;
    camera.lookAt(0, -scrollProgress * 2, -5);
  });

  return null;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  SCENE CONTENT — All 3D elements composed together                     */
/* ═══════════════════════════════════════════════════════════════════════ */

function SceneContent({ scrollProgress, mouse }: {
  scrollProgress: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  return (
    <>
      <CameraRig scrollProgress={scrollProgress} mouse={mouse} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 5, 5]} intensity={0.3} color="#00d4c8" />
      <pointLight position={[-5, 3, -3]} intensity={0.5} color="#38bdf8" distance={15} decay={2} />
      <pointLight position={[3, -2, -5]} intensity={0.3} color="#8b5cf6" distance={12} decay={2} />
      <Stars radius={50} depth={40} count={3000} factor={3} saturation={0.2} fade speed={0.5} />
      <ParticleField scrollProgress={scrollProgress} mouse={mouse} />
      <HeroOrb scrollProgress={scrollProgress} mouse={mouse} />
      <PlanetSystem scrollProgress={scrollProgress} mouse={mouse} />
      <AuroraRibbons scrollProgress={scrollProgress} />
      <LightBeams scrollProgress={scrollProgress} />
      <fog attach="fog" args={['#040612', 5, 25]} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  2D OVERLAYS — Film grain, vignette, gradient tint                     */
/* ═══════════════════════════════════════════════════════════════════════ */

function Overlays({ scrollProgress }: { scrollProgress: number }) {
  const grainOpacity = 0.03 + scrollProgress * 0.02;
  return (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,${0.4 + scrollProgress * 0.3}) 100%)` }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 0%, transparent 70%, rgba(4,6,18,0.5) 100%)' }} />
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay" style={{ opacity: grainOpacity, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`, backgroundSize: '128px 128px' }} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  CSS FALLBACK                                                          */
/* ═══════════════════════════════════════════════════════════════════════ */

function CSSFallbackBackground({ scrollProgress }: { scrollProgress: number }) {
  return (
    <>
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(59,130,246,0.06) 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.04) 0%, transparent 50%), #040612` }} />
      <div className="absolute top-[-10%] left-[25%] w-[50%] h-[50%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,212,200,0.06) 0%, transparent 70%)', transform: `translateY(${scrollProgress * -100}px)`, transition: 'transform 0.3s ease-out' }} />
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
  componentDidCatch(error: Error) { console.warn('[CinematicBackground] WebGL error:', error.message); }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
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
        <WebGLErrorBoundary fallback={<CSSFallbackBackground scrollProgress={scrollProgress} />}>
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
        <CSSFallbackBackground scrollProgress={scrollProgress} />
      )}
      <Overlays scrollProgress={scrollProgress} />
    </div>
  );
}
