import { useGSAP } from '@gsap/react';
import { ArrowRight, Check, Sparkles, UploadCloud } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ContactDialog } from '../../components/contact/ContactDialog';
import { EditorialGallery } from '../../components/storefront/EditorialGallery';
import { HeroPreview } from '../../components/storefront/HeroPreview';
import { LedComparison } from '../../components/storefront/LedComparison';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { gsap, prefersReducedMotion } from '../../lib/motion';

// Reassurances that belong next to the first call to action rather than buried
// in the FAQ: the objections people raise before they will start a design.
const HERO_PROOF = [
  '100% shatterproof',
  'Dead silent (0 dB)',
  '50,000h lifespan',
  '12V child & pet safe',
  'Free dimmer remote',
  'Fast global delivery',
];

export function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <EditorialGallery />
      <LedComparison />
      <ImmersiveCTA />
    </div>
  );
}

function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !rootRef.current) return;
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      // Five headline lines now, so the per-line stagger is tighter than it was
      // at three — otherwise the reveal outlasts the fold.
      tl.from('.hero-eyebrow', { opacity: 0, y: 12, duration: 0.6 })
        .from('.hero-line > span', { yPercent: 110, duration: 0.8, stagger: 0.08 }, '-=0.3')
        .from('.hero-copy-block', { opacity: 0, y: 16, duration: 0.7 }, '-=0.4')
        .from('.hero-preview', { opacity: 0, y: 24, duration: 0.8 }, '-=0.6');
    },
    { scope: rootRef },
  );

  return (
    <header
      ref={rootRef}
      className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden bg-background"
    >

      <div className="relative z-20 container grid w-full items-center gap-16 py-24 lg:grid-cols-[1fr_1fr] lg:gap-12 lg:py-20">
        {/* Left: the pitch */}
        <div className="max-w-xl">
          <span className="hero-eyebrow mb-10 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full border border-border bg-card/60 px-5 py-2.5 font-label text-xs uppercase tracking-[0.16em] text-foreground backdrop-blur-sm">
            Next-gen architectural LED neon
          </span>

          <h1 className="font-display text-5xl uppercase leading-[0.88] text-foreground sm:text-6xl md:text-7xl">
            <span className="hero-line block overflow-hidden">
              <span className="block">Illuminate</span>
            </span>
            <span className="hero-line block overflow-hidden">
              <span className="block">Your World</span>
            </span>
            <span className="hero-line block overflow-hidden">
              <span className="block">With</span>
            </span>
            <span className="hero-line block overflow-hidden">
              <span className="brand-text-gradient block">Bespoke</span>
            </span>
            <span className="hero-line block overflow-hidden">
              <span className="brand-text-gradient block">Light.</span>
            </span>
          </h1>

          <div className="hero-copy-block mt-10">
            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
              Museum-grade LED neon engineered with silicone flex tubing over cast acrylic. Built for luxury
              residences, commercial brands, and unforgettable weddings.
            </p>

            {/* One button, not two: the studio is a single page that handles
                typed text, drawings and logo uploads alike, so offering two
                routes to it was a choice with no consequence. The subline
                carries the upload affordance the label cannot. */}
            <div className="mt-10">
              <Link
                to="/custom-neon"
                className="group inline-flex w-full items-center justify-center gap-3 rounded-xl bg-brand px-8 py-5 font-label text-xs font-bold uppercase tracking-[0.16em] text-brand-foreground transition-transform hover:scale-[1.02] sm:w-auto"
              >
                <Sparkles aria-hidden className="h-4 w-4" />
                Open the design studio
                <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
                <UploadCloud aria-hidden className="h-4 w-4 shrink-0" />
                Type it, draw it, or upload your own logo
              </p>
            </div>

            <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-border pt-10 sm:gap-x-8 lg:grid-cols-3">
              {HERO_PROOF.map((label) => (
                <li key={label} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  {/* items-start + the icon's own top nudge keeps the tick aligned
                      to the first line when a label wraps in a narrow column. */}
                  <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: the live proof */}
        <HeroPreview />
      </div>
    </header>
  );
}

// function Process() {
//   const headRef = useScrollReveal<HTMLDivElement>();
//   const gridRef = useStaggerReveal<HTMLDivElement>('.process-step');

//   return (
//     <section id="process" className="bg-card py-32 sm:py-40">
//       <div className="container">
//         <div ref={headRef} className="mb-20 flex flex-col justify-between gap-8 sm:mb-32 md:flex-row md:items-baseline">
//           <h2 className="font-display text-4xl text-foreground sm:text-5xl">
//             The Art of <br /> Atmosphere
//           </h2>
//           <p className="max-w-sm font-label text-xs uppercase leading-relaxed tracking-widest text-muted-foreground">
//             A seamless transition from digital concept to hand-wired physical masterpiece.
//           </p>
//         </div>
//         <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3">
//           {PROCESS_STEPS.map((step, i) => (
//             <SpotlightCard
//               key={step.n}
//               className={cn(
//                 'process-step group border border-border p-12 transition-colors hover:bg-white/5',
//                 i === 1 && 'md:-mt-12',
//               )}
//             >
//               <span
//                 className="pointer-events-none absolute left-4 top-4 select-none font-display text-7xl text-foreground/5 transition-colors group-hover:[color:color-mix(in_srgb,var(--brand-primary)_18%,transparent)]"
//               >
//                 {step.n}
//               </span>
//               <div className="relative z-10">
//                 <h3 className="mb-6 font-display text-2xl text-foreground">{step.title}</h3>
//                 <p className="mb-8 text-muted-foreground">{step.body}</p>
//                 <div className="brand-hairline h-px w-8" />
//               </div>
//             </SpotlightCard>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }

function ImmersiveCTA() {
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <section className="relative flex items-center justify-center overflow-hidden py-40 text-center sm:py-60">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[80vw] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full blur-[150px]"
        style={{ background: 'color-mix(in srgb, var(--brand-primary) 5%, transparent)' }}
      />
      <div ref={ref} className="relative z-10 px-4">
        <h2 className="cta-glow mb-12 font-display text-6xl text-foreground sm:text-8xl md:text-[120px]">
          Ready to Glow?
        </h2>
        <p className="mx-auto mb-20 max-w-2xl text-lg tracking-wide text-muted-foreground">
          Transform your vision into a luminous centerpiece. Our studio is now accepting new commissions.
        </p>
        <div className="flex flex-col items-center justify-center gap-10 md:flex-row">
          <Link
            to="/custom-neon"
            className="rounded-full bg-brand px-16 py-6 font-label text-xs font-bold uppercase tracking-[0.3em] text-brand-foreground transition-transform hover:scale-105"
          >
            Get a Quote
          </Link>
          <ContactDialog topic="designer">
            <button
              type="button"
              className="group flex items-center gap-4 font-label text-xs font-bold uppercase tracking-[0.3em] text-brand"
            >
              <span className="brand-hairline h-px w-12 transition-all group-hover:w-16" />
              Speak with a Designer
            </button>
          </ContactDialog>
        </div>
      </div>
    </section>
  );
}
