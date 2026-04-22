import { useRef, useEffect, useState, useCallback, RefObject } from 'react';

/**
 * Lightweight scroll-based parallax for portal content.
 * Returns a ref and a transform style to apply to elements.
 * 
 * @param speed - Parallax speed multiplier (0.01 = subtle, 0.1 = dramatic)
 * @param direction - 'y' for vertical, 'x' for horizontal
 */
export function useParallax(speed: number = 0.03, direction: 'y' | 'x' = 'y') {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  const handleScroll = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const elementCenter = rect.top + rect.height / 2;
    const distance = (elementCenter - viewportCenter) * speed;
    setOffset(distance);
  }, [speed]);

  useEffect(() => {
    // Use the closest scrollable parent or window
    const scrollParent = ref.current?.closest('[class*="overflow"]') || window;
    scrollParent.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initial
    return () => scrollParent.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const style = {
    transform: direction === 'y' 
      ? `translateY(${offset}px)` 
      : `translateX(${offset}px)`,
    transition: 'transform 0.1s ease-out',
    willChange: 'transform' as const,
  };

  return { ref, style, offset };
}

/**
 * Mouse-tracking parallax for cards — subtle depth effect on hover.
 * Apply to a card wrapper for a "floating" feel.
 */
export function useMouseParallax(intensity: number = 8) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTransform(`perspective(800px) rotateX(${-y * intensity}deg) rotateY(${x * intensity}deg) scale(1.01)`);
    };

    const handleMouseLeave = () => {
      setTransform('perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)');
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [intensity]);

  const style = {
    transform,
    transition: 'transform 0.2s ease-out',
  };

  return { ref, style };
}
