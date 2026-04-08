/**
 * CelebrationAnimation — Accept-project celebration
 * 
 * Council recommendation (Aurora): Build accept-project celebration animation.
 * Shows confetti-style burst when a project is accepted / milestone completed.
 */

import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
  type: 'confetti' | 'circle' | 'star';
}

interface CelebrationAnimationProps {
  trigger: boolean;
  onComplete?: () => void;
  className?: string;
  duration?: number;
}

const COLORS = [
  'bg-primary', 'bg-emerald-400', 'bg-cyan-400', 'bg-amber-400',
  'bg-purple-400', 'bg-pink-400', 'bg-blue-400',
];

const TYPES: Particle['type'][] = ['confetti', 'circle', 'star'];

export const CelebrationAnimation = ({
  trigger,
  onComplete,
  className,
  duration = 2000,
}: CelebrationAnimationProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [show, setShow] = useState(false);

  const generateParticles = useCallback(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 80,
      y: 50 + (Math.random() - 0.5) * 60,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 300,
      type: TYPES[Math.floor(Math.random() * TYPES.length)],
    }));
  }, []);

  useEffect(() => {
    if (trigger) {
      setParticles(generateParticles());
      setShow(true);
      const t = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(t);
    }
  }, [trigger, duration, onComplete, generateParticles]);

  if (!show) return null;

  return (
    <div className={cn('fixed inset-0 pointer-events-none z-50 overflow-hidden', className)}>
      {particles.map(p => (
        <div
          key={p.id}
          className={cn('absolute', p.color)}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
            width: p.type === 'confetti' ? '8px' : '6px',
            height: p.type === 'confetti' ? '16px' : '6px',
            borderRadius: p.type === 'circle' ? '50%' : p.type === 'star' ? '2px' : '1px',
            animation: `celebration-fall ${1 + Math.random()}s ease-out ${p.delay}ms forwards`,
            opacity: 0,
          }}
        />
      ))}
      {/* Center burst glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-primary/20 blur-3xl"
        style={{ animation: 'celebration-glow 1s ease-out forwards' }}
      />
    </div>
  );
};
