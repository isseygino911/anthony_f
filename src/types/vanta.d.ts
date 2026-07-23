// vanta ships no TypeScript declarations; each effect is a separate deep
// import (e.g. 'vanta/dist/vanta.net.min') so we declare the wildcard.
declare module 'vanta/dist/vanta.net.min' {
  import type * as THREE from 'three';

  interface VantaNetOptions {
    el: HTMLElement;
    THREE: typeof THREE;
    color?: number;
    backgroundColor?: number;
    points?: number;
    maxDistance?: number;
    spacing?: number;
    showDots?: boolean;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
  }

  interface VantaEffect {
    destroy(): void;
    setOptions(options: Partial<VantaNetOptions>): void;
  }

  export default function NET(options: VantaNetOptions): VantaEffect;
}
