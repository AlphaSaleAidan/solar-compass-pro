/**
 * PageTransition — Framer Motion wrapper for smooth page transitions.
 * Wrap any page/tab content to get fade + slide animations.
 */

import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  /** Unique key for the current page/tab — changes trigger transition */
  pageKey: string;
  /** Animation style */
  variant?: 'fade' | 'slideUp' | 'slideRight';
  className?: string;
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  slideUp: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  },
  slideRight: {
    initial: { opacity: 0, x: -12 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 12 },
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function PageTransition({
  children,
  pageKey,
  variant = 'slideUp',
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
