import { Eye, Sparkles, Sun } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { NEON_PRESETS } from '../../api/customNeon';
import { cn } from '../../lib/utils';
import type { NeonPresetColor } from '../../types';

// A shortlist of the designer's script faces. index.html already loads all
// five for /custom-neon, so these cost nothing extra here; the values are the
// exact FONT_OPTIONS strings so a pick maps 1:1 onto the real designer.
const FONTS: { value: string; label: string }[] = [
  { value: '"Dancing Script", cursive', label: 'Dancing Script' },
  { value: '"Pacifico", cursive', label: 'Pacifico' },
  { value: '"Permanent Marker", cursive', label: 'Marker' },
];

const PLACEHOLDER = 'Bespoke Neon';

// Mirrors the caps in pages/storefront/CustomNeon.tsx, so the teaser can never
// preview something the designer would refuse to render.
const MAX_TEXT_LENGTH = 60;

// Real neon reads as a white-hot core inside a coloured halo — filling the
// glyphs with the tube colour instead looks flat and plastic. So: white text,
// tight white shadows for the core, then progressively wider, progressively
// softer shadows in the tube colour for the bloom.
//
// The bloom runs deliberately hot: the near layers stay at full saturation so
// the tube reads as a light source rather than coloured text, and the outer
// layers fade out over a long distance (up to 160px) so the halo falls off the
// way real light does instead of ending at a hard edge.
function neonTextShadow(hex: string): string {
  const soft = `color-mix(in srgb, ${hex} 65%, transparent)`;
  const faint = `color-mix(in srgb, ${hex} 35%, transparent)`;
  return [
    // White-hot core — three tight layers so the glyph centre blows out to
    // white the way a lit tube does under a camera.
    '0 0 2px #fff',
    '0 0 6px #fff',
    '0 0 12px #fff',
    // Saturated near-bloom.
    `0 0 20px ${hex}`,
    `0 0 40px ${hex}`,
    `0 0 70px ${hex}`,
    // Long, soft falloff.
    `0 0 110px ${soft}`,
    `0 0 160px ${faint}`,
  ].join(', ');
}

/**
 * The hero's right-hand column: a self-contained sign previewer. Deliberately
 * takes no props — the hero should not have to own preview state — and calls no
 * API, so the first paint stays free of network work.
 */
export function HeroPreview() {
  const [text, setText] = useState('');
  const [color, setColor] = useState<NeonPresetColor>('ice-blue');
  const [font, setFont] = useState(FONTS[0].value);
  const [lit, setLit] = useState(true);

  const preset = NEON_PRESETS.find((option) => option.value === color);
  const swatch = preset?.swatch ?? '#ffffff';
  const shown = text.trim() || PLACEHOLDER;

  return (
    <div className="hero-preview relative">
      {/* The ambient wash the whole panel floats on. It is keyed to the chosen
          tube colour, so picking a swatch relights the corner of the page —
          the panel reads as a lamp rather than as a screenshot.

          Two stacked layers, because a single wash cannot do both jobs on a
          light background: a wide, soft halo for reach, plus a tighter, more
          saturated core so the colour is actually identifiable. The mix
          percentages run high (55%/40%) — on the previous near-black surface a
          22% tint was plenty, but the same value over white washes out to
          nothing, so the colour has to be laid on considerably harder here. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-24 -z-10 rounded-full blur-[130px] transition-opacity duration-700"
        style={{
          opacity: lit ? 1 : 0.12,
          background: `radial-gradient(circle at 50% 45%, color-mix(in srgb, ${swatch} 55%, transparent), transparent 72%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 -z-10 rounded-full blur-[70px] transition-opacity duration-700"
        style={{
          opacity: lit ? 1 : 0.12,
          background: `radial-gradient(circle at 50% 45%, color-mix(in srgb, ${swatch} 40%, transparent), transparent 65%)`,
        }}
      />

      <div className="rounded-3xl border border-border bg-card/60 p-5 backdrop-blur-sm sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <label htmlFor="hero-preview-text" className="flex min-w-0 flex-1 items-center gap-3">
            <span className="shrink-0 font-label text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Try typing
            </span>
            <input
              id="hero-preview-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={MAX_TEXT_LENGTH}
              placeholder={PLACEHOLDER}
              className="min-w-0 flex-1 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-brand"
            />
          </label>
          <button
            type="button"
            onClick={() => setLit((on) => !on)}
            aria-pressed={lit}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 font-label text-xs uppercase tracking-[0.12em] transition-colors',
              lit ? 'border-brand text-brand' : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            <Sun aria-hidden className="h-3.5 w-3.5" />
            Lights {lit ? 'on' : 'off'}
          </button>
        </div>

        {/* Preview wall. Always dark, regardless of the site theme: the lit tube
            renders as white text plus a coloured glow, which is physically what
            neon looks like but is invisible on a light surface. `dark-section`
            rebinds the surface/text tokens to the dark scale for this subtree
            only, so the glow has something to glow against. */}
        <div className="dark-section relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-background p-8 sm:min-h-[300px]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
          />
          {/* Ambient spill: a lit sign washes its colour onto the wall behind it.
              Without this the glow stops dead at the glyph edge and the tube
              reads as a sticker rather than a light source. Fades out with the
              lights, and sits behind the backplate so the wash never dims the
              tube itself. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 transition-opacity duration-700"
            style={{
              opacity: lit ? 1 : 0,
              background: `radial-gradient(60% 55% at 50% 50%, color-mix(in srgb, ${swatch} 26%, transparent), transparent 70%)`,
            }}
          />

          {/* The acrylic backplate the tube is mounted on, standoffs and all. */}
          <div className="relative rounded-xl border border-white/10 bg-white/[0.03] px-8 py-6 shadow-2xl sm:px-12 sm:py-8">
            {['left-2 top-2', 'right-2 top-2', 'left-2 bottom-2', 'right-2 bottom-2'].map((position) => (
              <span
                key={position}
                aria-hidden
                className={cn('absolute h-2 w-2 rounded-full bg-white/40', position)}
              />
            ))}
            <p
              className="break-words text-center text-3xl leading-[1.25] transition-[text-shadow,color] duration-500 sm:text-4xl"
              style={{
                fontFamily: font,
                color: lit ? '#fff' : `color-mix(in srgb, ${swatch} 22%, #1a1a1a)`,
                textShadow: lit ? neonTextShadow(swatch) : 'none',
              }}
            >
              {shown}
            </p>
          </div>

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-card/80 px-4 py-1.5 font-label text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Interactive proof · {FONTS.find((option) => option.value === font)?.label} ·{' '}
            {preset?.label ?? 'Custom'}
          </p>
        </div>

        <fieldset className="mt-6">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <legend className="flex items-center gap-2 font-label text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles aria-hidden className="h-3.5 w-3.5" />
              Colour radiance
            </legend>
            <span className="font-label text-xs text-foreground">{preset?.label}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {NEON_PRESETS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-label={option.label}
                aria-pressed={color === option.value}
                onClick={() => setColor(option.value)}
                className={cn(
                  'h-8 w-8 rounded-full transition-transform hover:scale-110',
                  color === option.value && 'ring-2 ring-foreground ring-offset-2 ring-offset-card',
                )}
                style={{ backgroundColor: option.swatch }}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="mb-3 font-label text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Font archetype
          </legend>
          <div className="flex flex-wrap gap-2">
            {FONTS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={font === option.value}
                onClick={() => setFont(option.value)}
                className={cn(
                  'rounded-lg border px-4 py-2 text-sm transition-colors',
                  font === option.value
                    ? 'border-brand bg-foreground/5 text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
                style={{ fontFamily: option.value }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <Link
          to="/custom-neon"
          className="group mt-6 flex items-center justify-center gap-3 rounded-xl border border-border bg-background/60 px-6 py-4 font-label text-xs uppercase tracking-[0.12em] text-foreground transition-colors hover:border-brand"
        >
          <Eye aria-hidden className="h-4 w-4 text-brand" />
          Customize in the full design studio
        </Link>
      </div>
    </div>
  );
}
