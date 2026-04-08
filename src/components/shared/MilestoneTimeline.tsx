import React from 'react';
import { CheckCircle, Clock, Lock, Circle } from 'lucide-react';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';

interface MilestoneTimelineProps {
  currentMilestone: number; // 0-indexed: which milestone is active
  fundStatus: Record<number, string>; // milestoneIdx -> 'none'|'pending'|'approved'|'released'
  compact?: boolean;
}

const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({ currentMilestone, fundStatus, compact }) => {
  return (
    <div className={`w-full ${compact ? 'py-2' : 'py-4'}`}>
      <div className="relative flex items-center justify-between">
        {/* Background track */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />
        {/* Progress track */}
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-[hsl(var(--green))] via-primary to-primary -translate-y-1/2 z-0 transition-all duration-700 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, (currentMilestone / (MILESTONE_SOPS.length - 1)) * 100))}%` }}
        />

        {MILESTONE_SOPS.map((sop, i) => {
          const isComplete = i < currentMilestone;
          const isCurrent = i === currentMilestone;
          const isLocked = i > currentMilestone;
          const released = fundStatus[i] === 'released';

          return (
            <div key={sop.id} className="relative z-10 flex flex-col items-center group">
              {/* Node */}
              <div
                className={`
                  ${compact ? 'w-7 h-7' : 'w-9 h-9'} rounded-full flex items-center justify-center transition-all duration-300
                  ${isComplete
                    ? 'bg-[hsl(var(--green))] text-white shadow-[0_0_12px_hsl(var(--green)/0.4)]'
                    : isCurrent
                      ? 'bg-primary text-primary-foreground shadow-[0_0_16px_hsl(var(--primary)/0.5)] ring-2 ring-primary/30 ring-offset-2 ring-offset-card animate-pulse'
                      : 'bg-muted border border-border text-muted-foreground'
                  }
                `}
              >
                {isComplete ? (
                  <CheckCircle className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                ) : isCurrent ? (
                  <Clock className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                ) : isLocked ? (
                  <Lock className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                ) : (
                  <Circle className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                )}
              </div>

              {/* Label */}
              {!compact && (
                <div className="mt-2 text-center max-w-[80px]">
                  <div className={`text-[9px] font-extrabold tracking-wider uppercase ${
                    isComplete ? 'text-[hsl(var(--green))]' : isCurrent ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {sop.id}
                  </div>
                  <div className={`text-[8px] leading-tight ${
                    isComplete || isCurrent ? 'text-card-foreground' : 'text-muted-foreground'
                  }`}>
                    {sop.shortName}
                  </div>
                  {/* Fund badge */}
                  <div className={`mt-0.5 text-[7px] font-bold px-1.5 py-0.5 rounded-full inline-block ${
                    released
                      ? 'bg-[hsl(var(--green))]/10 text-[hsl(var(--green))]'
                      : isComplete
                        ? 'bg-[hsl(var(--green))]/5 text-[hsl(var(--green))]/60'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {sop.fundPercent}%{released ? ' ✓' : ''}
                  </div>
                </div>
              )}

              {/* Tooltip on hover for compact mode */}
              {compact && (
                <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded px-2 py-1 shadow-lg whitespace-nowrap z-50 pointer-events-none">
                  <span className="text-[9px] font-bold text-card-foreground">{sop.id}: {sop.shortName}</span>
                  <span className="text-[8px] text-muted-foreground ml-1">({sop.fundPercent}%)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MilestoneTimeline;
