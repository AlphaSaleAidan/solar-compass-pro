/**
 * LoadingChoreography — Multi-step loading animation
 * 
 * Council recommendation (Aurora): Build loading choreography:
 * satellite pulse → streaming dots → checkmark burst
 */

import { useState, useEffect } from 'react';
import { Satellite, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Stage = 'pulse' | 'streaming' | 'complete';

interface LoadingChoreographyProps {
  isLoading: boolean;
  onComplete?: () => void;
  label?: string;
  className?: string;
}

export const LoadingChoreography = ({
  isLoading,
  onComplete,
  label = 'Loading',
  className,
}: LoadingChoreographyProps) => {
  const [stage, setStage] = useState<Stage>('pulse');

  useEffect(() => {
    if (!isLoading && stage === 'streaming') {
      setStage('complete');
      const t = setTimeout(() => onComplete?.(), 800);
      return () => clearTimeout(t);
    }
    if (isLoading) {
      setStage('pulse');
      const t = setTimeout(() => setStage('streaming'), 1200);
      return () => clearTimeout(t);
    }
  }, [isLoading, stage, onComplete]);

  if (!isLoading && stage !== 'complete') return null;

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-8', className)}>
      {/* Stage 1: Satellite pulse */}
      {stage === 'pulse' && (
        <div className="relative animate-fade-in-up">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="absolute inset-[-8px] animate-[ping_1.5s_ease-in-out_infinite] rounded-full bg-primary/10" />
          <Satellite className="w-10 h-10 text-primary animate-[spin_3s_linear_infinite]" />
        </div>
      )}

      {/* Stage 2: Streaming dots */}
      {stage === 'streaming' && (
        <div className="flex items-center gap-2 animate-fade-in-up">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-primary"
              style={{
                animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                opacity: 0.4 + (i * 0.15),
              }}
            />
          ))}
        </div>
      )}

      {/* Stage 3: Checkmark burst */}
      {stage === 'complete' && (
        <div className="relative animate-scale-in">
          <div className="absolute inset-[-16px] rounded-full bg-emerald-400/20 animate-[ping_0.6s_ease-out_1]" />
          <div className="absolute inset-[-32px] rounded-full bg-emerald-400/10 animate-[ping_0.8s_ease-out_1]" />
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
      )}

      <p className="text-sm text-white/50 font-medium tracking-wide">
        {stage === 'pulse' && `${label}...`}
        {stage === 'streaming' && `${label}...`}
        {stage === 'complete' && 'Done!'}
      </p>
    </div>
  );
};
