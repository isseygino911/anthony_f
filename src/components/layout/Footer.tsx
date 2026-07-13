import { useTheme } from '../../hooks/useTheme';
import { SectionSurface } from './SectionSurface';

export function Footer() {
  const { theme } = useTheme();
  const variant = theme?.section_styles.footer ?? 'flat';

  return (
    <SectionSurface variant={variant} className="mt-auto">
      <div className="container flex flex-col items-center gap-3 py-16 text-center">
        <span className="font-display text-2xl tracking-tight">{theme?.brand_name ?? 'Storefront'}</span>
        {theme?.tagline && <span className="text-sm opacity-90">{theme.tagline}</span>}
        <span className="pt-4 text-[11px] uppercase tracking-[0.15em] opacity-70">
          &copy; {new Date().getFullYear()} {theme?.brand_name ?? 'Storefront'}. All rights reserved.
        </span>
      </div>
    </SectionSurface>
  );
}
