/**
 * SkeletonLoader — Shimmer loading placeholders for portal content.
 * Shows pulse-animated blocks that match the layout of real content.
 */

import { motion } from 'framer-motion';

/* ─── Base shimmer block ─────────────────────────────────────────────── */
const Shimmer = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden rounded-lg bg-white/[0.04] ${className}`}>
    <motion.div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
      }}
      animate={{ x: ['-100%', '100%'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

/* ─── KPI cards row ──────────────────────────────────────────────────── */
export const KpiSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
        <Shimmer className="h-3 w-16" />
        <Shimmer className="h-7 w-24" />
        <Shimmer className="h-2 w-12" />
      </div>
    ))}
  </div>
);

/* ─── Project card skeleton ──────────────────────────────────────────── */
export const ProjectCardSkeleton = () => (
  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Shimmer className="h-9 w-9 rounded-full" />
        <div className="space-y-2">
          <Shimmer className="h-4 w-32" />
          <Shimmer className="h-3 w-20" />
        </div>
      </div>
      <Shimmer className="h-6 w-16 rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-3">
      <Shimmer className="h-10 rounded-lg" />
      <Shimmer className="h-10 rounded-lg" />
      <Shimmer className="h-10 rounded-lg" />
    </div>
    <Shimmer className="h-2 w-full rounded-full" />
  </div>
);

/* ─── Table row skeleton ─────────────────────────────────────────────── */
export const TableRowSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="space-y-2">
    {[...Array(rows)].map((_, r) => (
      <div key={r} className="flex gap-4 items-center py-3 px-4 rounded-lg bg-white/[0.015]">
        {[...Array(cols)].map((_, c) => (
          <Shimmer key={c} className={`h-4 ${c === 0 ? 'w-28' : c === cols - 1 ? 'w-16' : 'w-20'}`} />
        ))}
      </div>
    ))}
  </div>
);

/* ─── Full portal skeleton ───────────────────────────────────────────── */
export const PortalSkeleton = () => (
  <motion.div
    className="space-y-5"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    {/* Tab bar */}
    <div className="flex gap-2">
      {[...Array(5)].map((_, i) => (
        <Shimmer key={i} className="h-8 w-20 rounded-lg" />
      ))}
    </div>
    {/* KPIs */}
    <KpiSkeleton />
    {/* Project cards */}
    <div className="space-y-3">
      <ProjectCardSkeleton />
      <ProjectCardSkeleton />
    </div>
  </motion.div>
);

/* ─── Dashboard overview skeleton ────────────────────────────────────── */
export const DashboardSkeleton = () => (
  <motion.div
    className="space-y-6"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <KpiSkeleton />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
        <Shimmer className="h-5 w-40" />
        <TableRowSkeleton rows={4} cols={3} />
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
        <Shimmer className="h-5 w-36" />
        <Shimmer className="h-40 w-full rounded-lg" />
      </div>
    </div>
  </motion.div>
);
