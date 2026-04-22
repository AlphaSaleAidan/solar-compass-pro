/**
 * ProjectLifecycleBar — visual horizontal timeline showing where a project
 * sits in the lifecycle: Lead → Qualified → QC Review → Active → Completed → Archived
 * 
 * Renders as a compact bar suitable for card headers or detail views.
 */
import { motion } from 'framer-motion';
import { type ProjectState, HAPPY_PATH, STATE_META } from '@/lib/projectStateMachine';

interface Props {
  currentState: ProjectState;
  compact?: boolean; // Smaller version for card headers
}

export const ProjectLifecycleBar = ({ currentState, compact = false }: Props) => {
  const currentIdx = HAPPY_PATH.indexOf(currentState);
  const isRejected = currentState === 'rejected';

  return (
    <div className={`flex items-center gap-1 ${compact ? 'py-1' : 'py-3'}`}>
      {HAPPY_PATH.map((state, i) => {
        const meta = STATE_META[state];
        const isActive = state === currentState;
        const isPast = !isRejected && currentIdx >= 0 && i < currentIdx;
        const isFuture = !isActive && !isPast;

        return (
          <div key={state} className="flex items-center gap-1 flex-1">
            {/* Node */}
            <motion.div
              className={`relative flex items-center justify-center rounded-full ${compact ? 'w-5 h-5' : 'w-7 h-7'}`}
              style={{
                background: isActive
                  ? meta.glowColor
                  : isPast
                    ? 'rgba(0,212,200,0.15)'
                    : 'rgba(255,255,255,0.04)',
                border: isActive
                  ? '2px solid currentColor'
                  : isPast
                    ? '2px solid rgba(0,212,200,0.3)'
                    : '2px solid rgba(255,255,255,0.08)',
                boxShadow: isActive ? `0 0 12px ${meta.glowColor}` : 'none',
              }}
              initial={false}
              animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={isActive ? { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } : {}}
            >
              {isPast && (
                <svg className="w-3 h-3 text-primary" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 8.5l3.5 3.5L13 4.5" />
                </svg>
              )}
              {isActive && (
                <div className={`rounded-full bg-current ${compact ? 'w-2 h-2' : 'w-2.5 h-2.5'}`} />
              )}
            </motion.div>

            {/* Label (non-compact only) */}
            {!compact && (
              <span className={`text-[10px] font-bold tracking-wider uppercase whitespace-nowrap ${
                isActive ? meta.color : isPast ? 'text-primary/50' : 'text-gray-600'
              }`}>
                {meta.label}
              </span>
            )}

            {/* Connector line */}
            {i < HAPPY_PATH.length - 1 && (
              <div
                className="flex-1 h-px mx-1"
                style={{
                  background: isPast
                    ? 'rgba(0,212,200,0.3)'
                    : 'rgba(255,255,255,0.06)',
                }}
              />
            )}
          </div>
        );
      })}

      {/* Rejected badge */}
      {isRejected && (
        <motion.div
          className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          REJECTED
        </motion.div>
      )}
    </div>
  );
};

/**
 * Compact state badge — single pill showing current state.
 * For use in table rows, list items, etc.
 */
export const StateBadge = ({ state }: { state: ProjectState }) => {
  const meta = STATE_META[state];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${meta.color}`}
      style={{
        background: meta.glowColor.replace(/[\d.]+\)$/, '0.1)'),
        border: `1px solid ${meta.glowColor.replace(/[\d.]+\)$/, '0.2)')}`,
      }}
    >
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
};
