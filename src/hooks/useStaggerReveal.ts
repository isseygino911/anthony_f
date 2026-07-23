import { useRef, type DependencyList } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, prefersReducedMotion } from '../lib/motion';

interface StaggerRevealOptions {
  y?: number;
  duration?: number;
  stagger?: number;
  start?: string;
}

/**
 * Reveals the children matched by `itemSelector` inside the returned ref as
 * they scroll into view. Pass `deps` (e.g. an item count) so the hook re-scopes
 * once async data replaces a loading/empty state with real children.
 */
export function useStaggerReveal<T extends HTMLElement = HTMLDivElement>(
  itemSelector: string,
  deps: DependencyList = [],
  options: StaggerRevealOptions = {},
) {
  const ref = useRef<T>(null);
  const { y = 24, duration = 0.8, stagger = 0.1, start = 'top 82%' } = options;

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      const items = ref.current.querySelectorAll(itemSelector);
      if (!items.length) return;
      gsap.from(items, {
        opacity: 0,
        y,
        duration,
        stagger,
        ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start },
      });
    },
    [itemSelector, y, duration, stagger, start, ...deps],
  );

  return ref;
}
