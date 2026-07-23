import Lenis from 'lenis';
import { useEffect, type ReactNode } from 'react';
import { gsap, prefersReducedMotion, ScrollTrigger } from '../../lib/motion';

/**
 * Site-wide Lenis smooth scroll, driven by GSAP's own ticker so it and
 * ScrollTrigger share one requestAnimationFrame loop instead of fighting
 * over scroll position (the official Lenis+GSAP integration pattern).
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({ autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);

    function update(time: number) {
      lenis.raf(time * 1000);
    }
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
