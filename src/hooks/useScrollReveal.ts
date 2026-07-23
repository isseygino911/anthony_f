import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, prefersReducedMotion } from '../lib/motion';

interface ScrollRevealOptions {
  y?: number;
  duration?: number;
  delay?: number;
  start?: string;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(options: ScrollRevealOptions = {}) {
  const ref = useRef<T>(null);
  const { y = 28, duration = 0.9, delay = 0, start = 'top 85%' } = options;

  useGSAP(() => {
    if (!ref.current || prefersReducedMotion()) return;
    gsap.from(ref.current, {
      opacity: 0,
      y,
      duration,
      delay,
      ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start },
    });
  }, [y, duration, delay, start]);

  return ref;
}
