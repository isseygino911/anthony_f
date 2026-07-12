import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

// Theming is entirely CSS-custom-property driven (architecture.md §5).
// Brand tokens map straight to variables written by theme/applyTheme.ts —
// never hardcode brand hex values or literal Tailwind color utilities here.
export default {
  darkMode: ['selector', '[data-mode="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        // Brand tokens — driven entirely by CSS variables set at runtime by
        // theme/applyTheme.ts from the server-resolved palette/custom colors.
        // NEVER replace usages of these with literal color utilities.
        brand: {
          DEFAULT: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          'tint-10': 'var(--brand-primary-tint-10)',
          'tint-90': 'var(--brand-primary-tint-90)',
          hover: 'var(--brand-primary-hover)',
          active: 'var(--brand-primary-active)',
          foreground: 'var(--brand-foreground)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [animate],
} satisfies Config
