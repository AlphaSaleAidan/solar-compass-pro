/**
 * PortalAmbient3D — Lightweight 3D ambient background for portal pages.
 * Subtle floating particles + gentle geometry for that premium feel.
 * Much lighter than landing page — optimized for dashboard performance.
 */

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Soft particle field ────────────────────────────────────────────── */
function AmbientParticles({ color, count = 400 }: { color: string; count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.01;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color={color}
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ─── Soft ambient shape ─────────────────────────────────────────────── */
function AmbientShape({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.08;
    ref.current.rotation.y = state.clock.elapsedTime * 0.06;
  });

  return (
    <Float speed={0.8} rotationIntensity={0.15} floatIntensity={0.3}>
      <mesh ref={ref} position={[0, 0, -5]}>
        <icosahedronGeometry args={[2, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.15}
          transparent
          opacity={0.04}
          wireframe
        />
      </mesh>
    </Float>
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */
interface PortalAmbient3DProps {
  /** 'dark' for ASP portals, 'light' for ASP+ portals */
  theme?: 'dark' | 'light';
}

export default function PortalAmbient3D({ theme = 'dark' }: PortalAmbient3DProps) {
  const isDark = theme === 'dark';
  const accentColor = isDark ? '#00d4c8' : '#00b8a9';
  const bgColor = isDark ? '#060811' : '#f8fafc';

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ background: bgColor }}
    >
      <Canvas
        dpr={[1, 1.2]}
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'low-power',
        }}
        style={{ position: 'absolute', inset: 0 }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <ambientLight intensity={isDark ? 0.1 : 0.5} />
          <pointLight position={[3, 3, 3]} intensity={0.2} color={accentColor} />

          <AmbientParticles color={accentColor} count={isDark ? 400 : 250} />
          <AmbientShape color={accentColor} />

          <fog attach="fog" args={[bgColor, 3, 15]} />
        </Suspense>
      </Canvas>

      {/* Soft vignette overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? `radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(6,8,17,0.7) 100%)`
            : `radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(248,250,252,0.8) 100%)`,
        }}
      />
    </div>
  );
}
