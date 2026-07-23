import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import NET from 'vanta/dist/vanta.net.min';
import { prefersReducedMotion } from '../lib/motion';

function hexToNumber(hex: string): number | null {
  const parsed = parseInt(hex.trim().replace('#', ''), 16);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Mounts a VANTA.NET WebGL background (a glowing constellation of connected
 * dots) into the returned ref, colored from the live --brand-primary token
 * so it follows whatever palette is active. Skipped entirely under
 * prefers-reduced-motion — WebGL animation, not a CSS effect that can fall
 * back to a static frame.
 */
export function useVantaNet() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;

    const brandPrimary = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary');
    const color = hexToNumber(brandPrimary) ?? 0xe6ff00;

    const effect = NET({
      el: ref.current,
      THREE,
      color,
      backgroundColor: 0x000000,
      points: 11,
      maxDistance: 22,
      spacing: 18,
      showDots: true,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1,
      scaleMobile: 1,
    });

    return () => effect.destroy();
  }, []);

  return ref;
}
