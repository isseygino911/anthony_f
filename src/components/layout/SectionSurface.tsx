import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import type { SectionStyle } from '../../types';

interface SectionSurfaceProps {
  variant: SectionStyle;
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
}

/**
 * One component, two rendering branches, built from the same two CSS
 * variables (architecture.md §5.2). Every homepage/group-page section wraps
 * its content in this per `site_theme.section_styles`.
 */
export function SectionSurface({ variant, className, children, style: customStyle }: SectionSurfaceProps) {
  const defaultStyle: CSSProperties =
    variant === 'gradient'
      ? { background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }
      : { background: 'var(--brand-primary)' };

  const style = { ...defaultStyle, ...customStyle };

  return (
    <section
      className={cn('text-[color:var(--brand-foreground)]', className)}
      style={style}
    >
      {children}
    </section>
  );
}
