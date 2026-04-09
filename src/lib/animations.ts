/**
 * Shared animation variants for Framer Motion.
 * Used across all portals and dashboard components for consistent feel.
 */

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;

/** Stagger children entrance — wrap a list of <motion.div> with this on the parent */
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

/** Individual item for stagger — use as variants on each child */
export const staggerItem = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: EASE_OUT_EXPO },
  },
};

/** Card hover — slight lift and glow */
export const cardHover = {
  scale: 1.005,
  y: -2,
  transition: { duration: 0.2, ease: EASE_OUT_QUINT },
};

/** Card tap — micro press */
export const cardTap = {
  scale: 0.995,
  transition: { duration: 0.1 },
};

/** Fade in from below — for sections on scroll */
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE_OUT_EXPO },
};

/** Expand/collapse for accordion-style content */
export const expandCollapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1, transition: { duration: 0.3, ease: EASE_OUT_QUINT } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2, ease: EASE_OUT_QUINT } },
};
