/**
 * PortalAmbient3D — Cinematic 3D ambient background for portal pages.
 * Floating particles, subtle mini-planet, soft glow — premium feel.
 * Lighter than landing page but still visually rich.
 */

import { useRef, useMemo, useState, Suspense, Component, type ReactNode, type ErrorInfo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Error Boundary for WebGL ───────────────────────────────────────── */
class WebGLBoundary extends Component<{ children: ReactNode; fallbackBg: string }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e: Error) { console.warn('[PortalAmbient3D] WebGL error:', e.message); }
  render() {
    if (this.state.err) return <div className="fixed inset-0 -z-10" style={{ background: this.props.fallbackBg }} />;
    return this.props.children;
  }
}

function isWebGLAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

/* ─── Soft particle field ────────────────────────────────────────────── */
function AmbientParticles({ color, count = 500 }: { color: string; count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const [positions, basePositions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 24;
      const y = (Math.random() - 0.5) * 14;
      const z = (Math.random() - 0.5) * 12 - 3;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      base[i * 3] = x;
      base[i * 3 + 1] = y;
      base[i * 3 + 2] = z;
    }
    return [pos, base];
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const posAttr = ref.current.geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      posAttr.array[i * 3] = basePositions[i * 3] + Math.sin(t * 0.08 + i * 0.05) * 0.15;
      posAttr.array[i * 3 + 1] = basePositions[i * 3 + 1] + Math.cos(t * 0.06 + i * 0.08) * 0.1;
    }
    posAttr.needsUpdate = true;

    ref.current.rotation.y = t * 0.008;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color={color}
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ─── Mini cartoon planet for portal background ──────────────────────── */
function MiniPlanet({ color, position, radius = 0.6 }: {
  color: string;
  position: [number, number, number];
  radius?: number;
}) {
  const planetRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Oversized craters
  const craters = useMemo(() => {
    const arr: { pos: THREE.Vector3; scale: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      arr.push({
        pos: new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        ),
        scale: 0.06 + Math.random() * 0.1,
      });
    }
    return arr;
  }, [radius]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (planetRef.current) {
      planetRef.current.rotation.y = t * 0.1;
      planetRef.current.rotation.x = 0.2;
    }
    if (atmosphereRef.current) {
      const pulse = 1 + Math.sin(t * 1.2) * 0.02;
      atmosphereRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <Float speed={0.6} rotationIntensity={0.08} floatIntensity={0.2}>
      <group position={position}>
        {/* Planet body */}
        <mesh ref={planetRef}>
          <sphereGeometry args={[radius, 24, 24]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.25}
            roughness={0.65}
            metalness={0.2}
          />
        </mesh>

        {/* Craters */}
        {craters.map((c, i) => (
          <mesh key={i} position={c.pos}>
            <sphereGeometry args={[c.scale, 8, 8]} />
            <meshStandardMaterial color="#000000" transparent opacity={0.3} roughness={0.9} />
          </mesh>
        ))}

        {/* Atmosphere */}
        <mesh ref={atmosphereRef}>
          <sphereGeometry args={[radius * 1.12, 20, 20]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.04}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Ring */}
        <mesh ref={ringRef} rotation={[Math.PI * 0.35, 0, 0.15]}>
          <ringGeometry args={[radius * 1.35, radius * 1.9, 36]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </Float>
  );
}

/* ─── Second small planet (no ring, just craters) ────────────────────── */
function TinyPlanet({ color, position }: { color: string; position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.15;
  });

  return (
    <Float speed={0.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh ref={ref}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.3}
            roughness={0.6}
          />
        </mesh>
        {/* Atmosphere */}
        <mesh>
          <sphereGeometry args={[0.3, 12, 12]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.04}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </Float>
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */
interface PortalAmbient3DProps {
  theme?: 'dark' | 'light';
}

export default function PortalAmbient3D({ theme = 'dark' }: PortalAmbient3DProps) {
  const isDark = theme === 'dark';
  const accentColor = isDark ? '#00d4c8' : '#00b8a9';
  const secondaryColor = isDark ? '#8b5cf6' : '#7c3aed';
  const bgColor = isDark ? '#060811' : '#f8fafc';
  const [webgl] = useState(() => isWebGLAvailable());

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ background: bgColor }}
    >
      {webgl && (
        <WebGLBoundary fallbackBg={bgColor}>
          <Canvas
            dpr={[1, 1.2]}
            camera={{ position: [0, 0, 5], fov: 50 }}
            gl={{ antialias: false, alpha: false, powerPreference: 'low-power' }}
            style={{ position: 'absolute', inset: 0 }}
            frameloop="always"
          >
            <Suspense fallback={null}>
              <ambientLight intensity={isDark ? 0.12 : 0.5} />
              <pointLight position={[3, 3, 3]} intensity={0.25} color={accentColor} />
              <pointLight position={[-4, -2, 2]} intensity={0.15} color={secondaryColor} />

              <AmbientParticles color={accentColor} count={isDark ? 500 : 300} />
              <MiniPlanet color={accentColor} position={[5.5, 2.5, -8]} radius={0.55} />
              <TinyPlanet color={secondaryColor} position={[-5, -2, -6]} />

              <fog attach="fog" args={[bgColor, 3, 18]} />
            </Suspense>
          </Canvas>
        </WebGLBoundary>
      )}

      {/* Soft vignette + glow overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? `radial-gradient(ellipse at 80% 20%, rgba(0,212,200,0.03) 0%, transparent 50%),
               radial-gradient(ellipse at 20% 80%, rgba(139,92,246,0.02) 0%, transparent 50%),
               radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(6,8,17,0.7) 100%)`
            : `radial-gradient(ellipse at 80% 20%, rgba(0,180,169,0.04) 0%, transparent 50%),
               radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(248,250,252,0.8) 100%)`,
        }}
      />
    </div>
  );
}
