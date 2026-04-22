import React from 'react';
import { CheckCircle, Clock, Lock, Circle, DollarSign } from 'lucide-react';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';

interface MilestoneTimelineProps {
  currentMilestone: number; // 0-indexed: which milestone is active
  fundStatus: Record<number, string>; // milestoneIdx -> 'none'|'pending'|'approved'|'released'
  compact?: boolean;
}

const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({ currentMilestone, fundStatus, compact }) => {
  const totalMilestones = MILESTONE_SOPS.length;
  const progressPercent = Math.max(0, Math.min(100, (currentMilestone / (totalMilestones - 1)) * 100));

  return (
    <div className={`w-full ${compact ? 'py-2' : 'py-4'}`}>
      <div className="relative flex items-center justify-between">
        {/* Background track */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-border/50 -translate-y-1/2 z-0 rounded-full" />
        {/* Progress track — animated gradient */}
        <div
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 z-0 rounded-full"
          style={{
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, hsl(var(--green)), hsl(var(--primary)), hsl(var(--primary)))',
            transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 0 8px hsl(var(--primary) / 0.4)',
          }}
        />

        {MILESTONE_SOPS.map((sop, i) => {
          const isComplete = i < currentMilestone;
          const isCurrent = i === currentMilestone;
          const isLocked = i > currentMilestone;
          const released = fundStatus[i] === 'released';
          const approved = fundStatus[i] === 'approved';
          const pending = fundStatus[i] === 'pending';

          return (
            <div key={sop.id} className="relative z-10 flex flex-col items-center group">
              {/* Pulse ring for current milestone */}
              {isCurrent && !compact && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full animate-ping bg-primary/20" style={{ animationDuration: '2s' }} />
              )}

              {/* Node */}
              <div
                className={`
                  ${compact ? 'w-7 h-7' : 'w-10 h-10'} rounded-full flex items-center justify-center relative
                  ${isComplete
                    ? 'bg-[hsl(var(--green))] text-white'
                    : isCurrent
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/40 ring-offset-2 ring-offset-card'
                      : 'bg-muted border-2 border-border text-muted-foreground'
                  }
                `}
                style={{
                  transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: isComplete
                    ? '0 0 12px hsl(var(--green) / 0.35), 0 2px 4px rgba(0,0,0,0.2)'
                    : isCurrent
                      ? '0 0 20px hsl(var(--primary) / 0.45), 0 2px 8px rgba(0,0,0,0.3)'
                      : '0 1px 3px rgba(0,0,0,0.2)',
                }}
              >
                {isComplete ? (
                  <CheckCircle className={compact ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'} />
                ) : isCurrent ? (
                  <Clock className={compact ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'} />
                ) : isLocked ? (
                  <Lock className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                ) : (
                  <Circle className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                )}
              </div>

              {/* Label */}
              {!compact && (
                <div className="mt-2.5 text-center max-w-[80px]">
                  <div className={`text-[9px] font-extrabold tracking-wider uppercase ${
                    isComplete ? 'text-[hsl(var(--green))]' : isCurrent ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {sop.id}
                  </div>
                  <div className={`text-[8px] leading-tight mt-0.5 ${
                    isComplete || isCurrent ? 'text-card-foreground' : 'text-muted-foreground'
                  }`}>
                    {sop.shortName}
                  </div>
                  {/* Fund badge with status */}
                  <div className={`mt-1 text-[7px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
                    released
                      ? 'bg-[hsl(var(--green))]/15 text-[hsl(var(--green))] shadow-[0_0_6px_hsl(var(--green)/0.2)]'
                      : approved
                        ? 'bg-primary/15 text-primary'
                        : pending
                          ? 'bg-[hsl(var(--yellow))]/15 text-[hsl(var(--yellow))]'
                          : isComplete
                            ? 'bg-[hsl(var(--green))]/5 text-[hsl(var(--green))]/60'
                            : 'bg-muted text-muted-foreground'
                  }`}>
                    {released && <DollarSign className="w-2.5 h-2.5" />}
                    {sop.fundPercent}%{released ? ' ✓' : approved ? ' ◉' : pending ? ' ◌' : ''}
                  </div>
                </div>
              )}

              {/* Tooltip on hover for compact mode */}
              {compact && (
                <div className="absolute -bottom-9 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-card border border-border rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap z-50 pointer-events-none">
                  <span className="text-[9px] font-bold text-card-foreground">{sop.id}: {sop.shortName}</span>
                  <span className="text-[8px] text-muted-foreground ml-1">({sop.fundPercent}%)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress summary bar */}
      {!compact && (
        <div className="mt-4 flex items-center justify-between text-[9px]">
          <span className="text-muted-foreground">
            <span className="text-[hsl(var(--green))] font-bold">{currentMilestone}</span> of {totalMilestones} milestones complete
          </span>
          <span className="text-muted-foreground font-bold">
            {Math.round(progressPercent)}% complete
          </span>
        </div>
      )}
    </div>
  );
};

export default MilestoneTimeline;
