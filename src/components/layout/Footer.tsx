import { useTheme } from '../../hooks/useTheme';
import { SectionSurface } from './SectionSurface';

export function Footer() {
  const { theme } = useTheme();
  const variant = theme?.section_styles.footer ?? 'flat';

  return (
    <SectionSurface variant={variant} className="mt-auto">
      <div className="container flex flex-col items-center gap-2 py-8 text-center text-sm">
        <span className="font-semibold">{theme?.brand_name ?? 'Storefront'}</span>
        {theme?.tagline && <span className="opacity-90">{theme.tagline}</span>}
        <span className="opacity-75">
          &copy; {new Date().getFullYear()} {theme?.brand_name ?? 'Storefront'}. All rights reserved.
        </span>
      </div>
    </SectionSurface>
  );
}
