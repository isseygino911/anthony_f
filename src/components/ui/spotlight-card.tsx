import { useRef, type MouseEvent, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Cursor-following spotlight overlay (React Bits "SpotlightCard" pattern) —
 * tracks the pointer via CSS custom properties rather than React state, so
 * the glow follows the mouse with zero re-renders.
 */
export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`);
  }

  return (
    <div ref={ref} onMouseMove={handleMouseMove} className={cn('group/spotlight relative overflow-hidden', className)}>
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/spotlight:opacity-100"
        style={{
          background:
            'radial-gradient(400px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), color-mix(in srgb, var(--brand-primary) 15%, transparent), transparent 70%)',
        }}
      />
      {children}
    </div>
  );
}
