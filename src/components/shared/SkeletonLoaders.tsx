/**
 * SkeletonLoaders — Shimmer loading placeholders
 * 
 * Council recommendation (Aurora): Add skeleton loading system.
 * Provides visual placeholders while data loads, preventing layout shift.
 */

import { cn } from '@/lib/utils';

/* ─── Base shimmer ──────────────────────────────────────────────────── */
const Shimmer = ({ className }: { className?: string }) => (
  <div className={cn(
    'animate-pulse rounded-lg bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]',
    className
  )} />
);

/* ─── Card skeleton ─────────────────────────────────────────────────── */
export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('glass-panel rounded-xl p-5 space-y-4', className)}>
    <div className="flex items-center gap-3">
      <Shimmer className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <Shimmer className="h-3 w-full" />
      <Shimmer className="h-3 w-5/6" />
      <Shimmer className="h-3 w-2/3" />
    </div>
    <Shimmer className="h-8 w-full rounded-lg" />
  </div>
);

/* ─── Stats row skeleton ────────────────────────────────────────────── */
export const SkeletonStats = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="glass-panel rounded-xl p-4 space-y-3">
        <Shimmer className="h-3 w-1/2" />
        <Shimmer className="h-7 w-2/3" />
        <Shimmer className="h-2 w-full rounded-full" />
      </div>
    ))}
  </div>
);

/* ─── Table skeleton ────────────────────────────────────────────────── */
export const SkeletonTable = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="glass-panel rounded-xl overflow-hidden">
    {/* Header */}
    <div className="flex gap-4 p-4 border-b border-white/5">
      {Array.from({ length: cols }).map((_, i) => (
        <Shimmer key={i} className="h-3 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-4 p-4 border-b border-white/[0.02]">
        {Array.from({ length: cols }).map((_, c) => (
          <Shimmer key={c} className={`h-4 flex-1 ${c === 0 ? 'w-1/3' : ''}`} />
        ))}
      </div>
    ))}
  </div>
);

/* ─── Dashboard skeleton ────────────────────────────────────────────── */
export const SkeletonDashboard = () => (
  <div className="space-y-6 animate-fade-in-up">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Shimmer className="h-7 w-48" />
        <Shimmer className="h-4 w-32" />
      </div>
      <Shimmer className="h-10 w-28 rounded-lg" />
    </div>
    <SkeletonStats count={4} />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SkeletonCard />
      <SkeletonCard />
    </div>
    <SkeletonTable rows={4} cols={5} />
  </div>
);

/* ─── Milestone timeline skeleton ───────────────────────────────────── */
export const SkeletonTimeline = () => (
  <div className="glass-panel rounded-xl p-5 space-y-4">
    <Shimmer className="h-5 w-40" />
    <div className="flex items-center gap-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <Shimmer className="w-8 h-8 rounded-full" />
          <Shimmer className="h-2 w-full rounded-full" />
          <Shimmer className="h-3 w-10" />
        </div>
      ))}
    </div>
  </div>
);
