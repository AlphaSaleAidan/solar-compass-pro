/**
 * Skeleton loading states for portal content.
 * Uses shimmer animation from index.css .skeleton class.
 */
import { motion } from 'framer-motion';

const Bone = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton rounded-lg ${className}`} />
);

/** Stat card grid skeleton — matches the 4-column stat grids in portals */
export const StatGridSkeleton = ({ cols = 4 }: { cols?: number }) => (
  <div className={`grid grid-cols-2 sm:grid-cols-${cols} gap-2 sm:gap-3`}>
    {Array.from({ length: cols }).map((_, i) => (
      <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <Bone className="h-3 w-16 mb-3" />
        <Bone className="h-7 w-20 mb-2" />
        <Bone className="h-2 w-12" />
      </div>
    ))}
  </div>
);

/** Project card skeleton — matches the card layout in portals */
export const ProjectCardSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bone className="h-10 w-10 rounded-xl" />
            <div>
              <Bone className="h-4 w-32 mb-2" />
              <Bone className="h-3 w-24" />
            </div>
          </div>
          <Bone className="h-6 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j}>
              <Bone className="h-2 w-12 mb-1.5" />
              <Bone className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

/** Milestone bar skeleton — matches the 7-step milestone bars */
export const MilestoneBarSkeleton = () => (
  <div className="flex items-center gap-1.5 my-4">
    {Array.from({ length: 7 }).map((_, i) => (
      <Bone key={i} className="h-8 flex-1 rounded-md" />
    ))}
  </div>
);

/** Table skeleton — for ops/financier table views */
export const TableSkeleton = ({ rows = 4, cols = 5 }: { rows?: number; cols?: number }) => (
  <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
    <div className="p-4 border-b border-white/[0.06] bg-white/[0.01]">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} className="h-3 w-16" />
        ))}
      </div>
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="p-4 border-b border-white/[0.03] last:border-0">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Bone key={c} className={`h-4 ${c === 0 ? 'w-28' : 'w-16'}`} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

/** Full page loading — centered spinner with pulse */
export const PageLoadingSkeleton = ({ label = 'Loading...' }: { label?: string }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center py-20 gap-4"
  >
    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full"
      />
    </div>
    <div className="text-xs text-gray-500 font-medium">{label}</div>
  </motion.div>
);

/** Dashboard skeleton — combines stat grid + project cards */
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <StatGridSkeleton cols={4} />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ProjectCardSkeleton count={2} />
      <div className="space-y-3">
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <Bone className="h-5 w-40 mb-4" />
          <Bone className="h-32 w-full rounded-xl" />
        </div>
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <Bone className="h-5 w-32 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Bone key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default { StatGridSkeleton, ProjectCardSkeleton, MilestoneBarSkeleton, TableSkeleton, PageLoadingSkeleton, DashboardSkeleton };
