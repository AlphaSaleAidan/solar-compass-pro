/**
 * CinematicBackground — Real WebGL 3D scene with React Three Fiber.
 * Scroll-reactive 3D particle field, floating geometry, aurora glow.
 * Inspired by akari.lusion.co — immersive, interactive, cinematic.
 */

import { useEffect, useRef, useState, useCallback, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, MeshTransmissionMaterial, Environment, Stars } from '@react-three/drei';
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

      // Gentle drift + scroll-driven vertical shift
      posAttr.array[i * 3] = bx + Math.sin(t * 0.15 + i * 0.1) * 0.3 + mouse.current.x * 0.5;
      posAttr.array[i * 3 + 1] = by + Math.cos(t * 0.12 + i * 0.15) * 0.2 - scrollProgress * 8 + mouse.current.y * 0.3;
      posAttr.array[i * 3 + 2] = bz + Math.sin(t * 0.1 + i * 0.05) * 0.2;
    }
    posAttr.needsUpdate = true;

    // Rotate entire field slowly
    meshRef.current.rotation.y = t * 0.02 + scrollProgress * 0.5;
    meshRef.current.rotation.x = scrollProgress * 0.3;
  });

  // Color shifts with scroll
  const color = useMemo(() => {
    const c = new THREE.Color();
    c.setHSL(0.49 - scrollProgress * 0.15, 0.8, 0.6);
    return c;
  }, [scrollProgress]);

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
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

    // Float up and shrink as user scrolls
    meshRef.current.position.y = 0.5 - scrollProgress * 4;
    meshRef.current.position.x = mouse.current.x * 0.8;

    // Scale down as it scrolls away
    const s = Math.max(0.2, 1.3 - scrollProgress * 1.5);
    meshRef.current.scale.setScalar(s);

    // Slow rotation
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
/*  FLOATING GEOMETRY — Scattered 3D shapes with scroll parallax          */
/* ═══════════════════════════════════════════════════════════════════════ */

function FloatingGeometry({ scrollProgress, mouse }: {
  scrollProgress: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const group = useRef<THREE.Group>(null);

  const shapes = useMemo(() => [
    { pos: [-5, 3, -6] as [number, number, number], scale: 0.4, speed: 0.3, type: 'torus' as const, color: '#00d4c8', parallax: 1.2 },
    { pos: [5, -2, -8] as [number, number, number], scale: 0.5, speed: 0.2, type: 'octahedron' as const, color: '#38bdf8', parallax: 0.8 },
    { pos: [-3, -4, -4] as [number, number, number], scale: 0.35, speed: 0.4, type: 'dodecahedron' as const, color: '#8b5cf6', parallax: 1.5 },
    { pos: [4, 4, -10] as [number, number, number], scale: 0.6, speed: 0.15, type: 'icosahedron' as const, color: '#00d4c8', parallax: 0.6 },
    { pos: [-6, -1, -7] as [number, number, number], scale: 0.3, speed: 0.35, type: 'torus' as const, color: '#f59e0b', parallax: 1.0 },
    { pos: [6, 1, -5] as [number, number, number], scale: 0.25, speed: 0.5, type: 'octahedron' as const, color: '#22c55e', parallax: 1.3 },
  ], []);

  useFrame((state) => {
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      const s = shapes[i];
      const t = state.clock.elapsedTime;
      child.rotation.x = t * s.speed;
      child.rotation.y = t * s.speed * 0.7;
      child.position.y = s.pos[1] - scrollProgress * 6 * s.parallax;
      child.position.x = s.pos[0] + mouse.current.x * 0.3 * s.parallax;
    });
  });

  return (
    <group ref={group}>
      {shapes.map((s, i) => (
        <mesh key={i} position={s.pos} scale={s.scale}>
          {s.type === 'torus' && <torusGeometry args={[1, 0.4, 16, 32]} />}
          {s.type === 'octahedron' && <octahedronGeometry args={[1, 0]} />}
          {s.type === 'dodecahedron' && <dodecahedronGeometry args={[1, 0]} />}
          {s.type === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}
          <meshStandardMaterial
            color={s.color}
            emissive={s.color}
            emissiveIntensity={0.4}
            roughness={0.3}
            metalness={0.7}
            transparent
            opacity={0.12}
            wireframe
          />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  AURORA RIBBONS — Glowing light bands that shift with scroll           */
/* ═══════════════════════════════════════════════════════════════════════ */

function AuroraRibbons({ scrollProgress }: { scrollProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(25, 8, 128, 1);
    return geo;
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
      <meshBasicMaterial
        color="#00d4c8"
        transparent
        opacity={0.04}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
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
            <meshBasicMaterial
              color="#00d4c8"
              transparent
              opacity={0.06}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
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
    // Smooth camera movement
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

      {/* Ambient + directional lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 5, 5]} intensity={0.3} color="#00d4c8" />
      <pointLight position={[-5, 3, -3]} intensity={0.5} color="#38bdf8" distance={15} decay={2} />
      <pointLight position={[3, -2, -5]} intensity={0.3} color="#8b5cf6" distance={12} decay={2} />

      {/* Star field background */}
      <Stars radius={50} depth={40} count={3000} factor={3} saturation={0.2} fade speed={0.5} />

      {/* Main elements */}
      <ParticleField scrollProgress={scrollProgress} mouse={mouse} />
      <HeroOrb scrollProgress={scrollProgress} mouse={mouse} />
      <FloatingGeometry scrollProgress={scrollProgress} mouse={mouse} />
      <AuroraRibbons scrollProgress={scrollProgress} />
      <LightBeams scrollProgress={scrollProgress} />

      {/* Fog for depth */}
      <fog attach="fog" args={['#040612', 5, 25]} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  2D OVERLAYS — Film grain, vignette, gradient tint (on top of 3D)      */
/* ═══════════════════════════════════════════════════════════════════════ */

function Overlays({ scrollProgress }: { scrollProgress: number }) {
  const grainOpacity = 0.03 + scrollProgress * 0.02;

  return (
    <>
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,${0.4 + scrollProgress * 0.3}) 100%)`,
        }}
      />

      {/* Bottom gradient fade for content readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, transparent 70%, rgba(4,6,18,0.5) 100%)',
        }}
      />

      {/* Film grain */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay"
        style={{
          opacity: grainOpacity,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                         MAIN COMPONENT                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function CinematicBackground() {
  const scrollProgress = useScrollProgress();
  const mouse = useMousePosition();

  return (
    <div className="fixed inset-0 -z-10" style={{ background: '#040612' }}>
      {/* WebGL Canvas — full screen 3D scene */}
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 1, 6], fov: 60, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Suspense fallback={null}>
          <SceneContent scrollProgress={scrollProgress} mouse={mouse} />
        </Suspense>
      </Canvas>

      {/* 2D overlays on top of 3D */}
      <Overlays scrollProgress={scrollProgress} />
    </div>
  );
}
