/**
 * PageTransition — Framer Motion wrapper for smooth page transitions.
 * Wrap any page/tab content to get fluid animations.
 * Supports multiple animation styles for different contexts.
 */

import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  /** Unique key for the current page/tab — changes trigger transition */
  pageKey: string;
  /** Animation style */
  variant?: 'fade' | 'slideUp' | 'slideRight' | 'scale' | 'wave' | 'morphUp';
  className?: string;
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
  slideUp: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  slideRight: {
    initial: { opacity: 0, x: -16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 16 },
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  scale: {
    initial: { opacity: 0, scale: 0.97 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.02 },
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  wave: {
    initial: { opacity: 0, y: 20, scale: 0.98, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, y: -10, scale: 0.99, filter: 'blur(2px)' },
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  morphUp: {
    initial: { opacity: 0, y: 24, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -12, scale: 0.99 },
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function PageTransition({
  children,
  pageKey,
  variant = 'wave',
  className = '',
}: PageTransitionProps) {
  const v = variants[variant];
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={v.initial}
        animate={v.animate}
        exit={v.exit}
        transition={v.transition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
