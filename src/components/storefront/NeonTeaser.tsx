import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { NEON_PRESETS } from '../../api/customNeon';
import { Switch } from '../ui/switch';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { cn } from '../../lib/utils';
import type { NeonPresetColor } from '../../types';

// A shortlist of the designer's script faces. index.html already loads all
// five for /custom-neon, so these cost nothing extra here; the values are the
// exact FONT_OPTIONS strings so a pick maps 1:1 onto the real designer.
const FONTS: { value: string; label: string }[] = [
  { value: '"Dancing Script", cursive', label: 'Dancing' },
  { value: '"Pacifico", cursive', label: 'Pacifico' },
  { value: '"Permanent Marker", cursive', label: 'Marker' },
];

const PLACEHOLDER = 'Good Vibes';

// Mirrors the caps in pages/storefront/CustomNeon.tsx, so the teaser can never
// preview something the designer would refuse to render.
const MAX_TEXT_LENGTH = 60;
const MAX_LINES = 4;

function toLines(text: string): string[] {
  const lines = text.split('\n').map((line) => line.trim());
  while (lines.length && !lines[0]) lines.shift();
  while (lines.length && !lines[lines.length - 1]) lines.pop();
  const capped = lines.slice(0, MAX_LINES);
  return capped.length ? capped : [PLACEHOLDER];
}

// Real neon reads as a white-hot core inside a coloured halo — filling the
// glyphs with the tube colour instead looks flat and plastic. So: white text,
// two tight white shadows for the core, then four progressively wider,
// progressively softer shadows in the tube colour for the bloom.
function neonTextShadow(hex: string): string {
  const soft = `color-mix(in srgb, ${hex} 70%, transparent)`;
  return [
    '0 0 4px #fff',
    '0 0 8px #fff',
    `0 0 16px ${hex}`,
    `0 0 32px ${hex}`,
    `0 0 64px ${soft}`,
    `0 0 96px ${soft}`,
  ].join(', ');
}

export function NeonTeaser() {
  const headRef = useScrollReveal<HTMLDivElement>();
  const [text, setText] = useState('');
  const [color, setColor] = useState<NeonPresetColor>('pink');
  const [font, setFont] = useState(FONTS[0].value);
  const [lit, setLit] = useState(true);

  const swatch = NEON_PRESETS.find((preset) => preset.value === color)?.swatch ?? '#ffffff';
  // Same line handling as the designer, so what you preview here is what it
  // will accept there — including the 4-line cap and the placeholder.
  const lines = toLines(text);

  return (
    <section className="relative overflow-hidden bg-background py-32 sm:py-40">
      <div className="container">
        <div ref={headRef} className="mb-16 max-w-2xl">
          <span className="mb-6 inline-flex items-center border-l-2 border-brand pl-4 font-label text-xs uppercase tracking-[0.4em] text-brand">
            Live Preview
          </span>
          <h2 className="font-display text-4xl leading-[0.95] text-foreground sm:text-5xl">
            See It <span className="brand-text-gradient">Glow</span> Before
            <br />
            You Commit
          </h2>
          <p className="mt-8 max-w-md text-muted-foreground">
            Type a few words and watch them light up. When you like what you see, carry it straight into the
            design tool.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-[1.35fr_1fr]">
          {/* Preview wall */}
          <div className="relative flex min-h-[320px] items-center justify-center bg-card p-10 sm:min-h-[420px] sm:p-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 transition-opacity duration-500"
              style={{
                opacity: lit ? 1 : 0,
                background: `radial-gradient(ellipse at center, color-mix(in srgb, ${swatch} 18%, transparent), transparent 70%)`,
              }}
            />
            <p
              className="relative z-10 break-words text-center text-4xl leading-[1.3] transition-[text-shadow,color] duration-500 sm:text-5xl md:text-6xl"
              style={{
                fontFamily: font,
                color: lit ? '#fff' : `color-mix(in srgb, ${swatch} 22%, #1a1a1a)`,
                textShadow: lit ? neonTextShadow(swatch) : 'none',
              }}
            >
              {lines.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-8 bg-card p-10 sm:p-12">
            <div>
              <label
                htmlFor="teaser-text"
                className="mb-3 block font-label text-xs uppercase tracking-[0.2em] text-muted-foreground"
              >
                Your text
              </label>
              <input
                id="teaser-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={MAX_TEXT_LENGTH}
                placeholder={PLACEHOLDER}
                className="w-full border-b border-border bg-transparent pb-3 font-display text-2xl text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-brand"
              />
            </div>

            <fieldset>
              <legend className="mb-3 font-label text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Colour
              </legend>
              <div className="flex flex-wrap gap-3">
                {NEON_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    aria-label={preset.label}
                    aria-pressed={color === preset.value}
                    onClick={() => setColor(preset.value)}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                      color === preset.value ? 'border-foreground' : 'border-transparent',
                    )}
                    style={{ backgroundColor: preset.swatch }}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-3 font-label text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Style
              </legend>
              <div className="flex flex-wrap gap-2">
                {FONTS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={font === option.value}
                    onClick={() => setFont(option.value)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm transition-colors',
                      font === option.value
                        ? 'border-brand text-brand'
                        : 'border-border text-muted-foreground hover:text-foreground',
                    )}
                    style={{ fontFamily: option.value }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex items-center justify-between border-t border-border pt-6">
              <label
                htmlFor="teaser-lit"
                className="font-label text-xs uppercase tracking-[0.2em] text-muted-foreground"
              >
                Lights {lit ? 'on' : 'off'}
              </label>
              <Switch id="teaser-lit" checked={lit} onCheckedChange={setLit} />
            </div>

            <Link
              to="/custom-neon"
              className="group mt-auto flex items-center justify-between gap-4 rounded-full bg-brand px-8 py-4 font-label text-xs font-bold uppercase tracking-[0.2em] text-brand-foreground transition-transform hover:scale-[1.02]"
            >
              Open the design tool
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
