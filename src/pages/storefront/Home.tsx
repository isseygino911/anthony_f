import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { EditorialGallery } from '../../components/storefront/EditorialGallery';
import { SpotlightCard } from '../../components/ui/spotlight-card';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useStaggerReveal } from '../../hooks/useStaggerReveal';
import { useVantaNet } from '../../hooks/useVantaNet';
import { gsap, prefersReducedMotion } from '../../lib/motion';
import { cn } from '../../lib/utils';

const PROCESS_STEPS = [
  {
    n: '01',
    title: 'Conceptualize',
    body: 'Work with our designers or use our bespoke toolkit to define color, font, and silhouette.',
  },
  {
    n: '02',
    title: 'Simulation',
    body: 'Experience your creation through spatial AR mockups, ensuring the perfect glow for your architecture.',
  },
  {
    n: '03',
    title: 'Fabrication',
    body: 'Our artisans hand-wire every bend, resulting in a premium, museum-grade light installation.',
  },
];

export function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Process />
      <EditorialGallery />
      <ImmersiveCTA />
    </div>
  );
}

function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const vantaRef = useVantaNet();

  useGSAP(
    () => {
      if (prefersReducedMotion() || !rootRef.current) return;
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-eyebrow', { opacity: 0, y: 12, duration: 0.6 })
        .from('.hero-line > span', { yPercent: 110, duration: 0.9, stagger: 0.12 }, '-=0.3')
        .from('.hero-copy-block', { opacity: 0, y: 16, duration: 0.7 }, '-=0.4');
    },
    { scope: rootRef },
  );

  return (
    <header
      ref={rootRef}
      className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-foreground"
    >
      <div ref={vantaRef} className="pointer-events-none absolute inset-0 z-0" />

      <div className="relative z-20 flex w-full justify-center px-6 py-20 sm:px-10 md:px-12 lg:px-16">
        <div className="w-full max-w-2xl text-center">
          <span className="hero-eyebrow mb-6 inline-flex items-center border-l-2 border-brand pl-4 font-label text-xs uppercase tracking-[0.4em] text-brand">
            Custom Neon Studio
          </span>
          <h1 className="font-display text-6xl leading-[0.85] text-foreground sm:text-7xl md:text-8xl">
            <span className="hero-line block overflow-hidden">
              <span className="block">Sculpting</span>
            </span>
            <span className="hero-line block overflow-hidden">
              <span className="block">
                <em className="font-light not-italic text-brand">Light</em> Into
              </span>
            </span>
            <span className="hero-line block overflow-hidden">
              <span className="block">Modern Art</span>
            </span>
          </h1>
          <div className="hero-copy-block mx-auto mt-10 max-w-md border-t border-border pt-8">
            <p className="mb-12 text-lg text-muted-foreground">
              We partner with brands and homeowners to craft high-fidelity LED neon experiences that transcend
              signage.
            </p>
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center">
              <Link
                to="/custom-neon"
                className="group relative overflow-hidden bg-foreground px-12 py-5 font-label text-xs uppercase tracking-[0.2em] text-background"
              >
                <span className="relative z-10">The Design Tool</span>
                <div className="absolute inset-0 translate-y-full bg-brand transition-transform duration-500 group-hover:translate-y-0" />
              </Link>
              <a
                href="#gallery"
                className="flex items-center gap-3 font-label text-xs uppercase tracking-widest text-brand transition-all hover:gap-5"
              >
                View Portfolio <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Process() {
  const headRef = useScrollReveal<HTMLDivElement>();
  const gridRef = useStaggerReveal<HTMLDivElement>('.process-step');

  return (
    <section id="process" className="bg-card py-32 sm:py-40">
      <div className="container">
        <div ref={headRef} className="mb-20 flex flex-col justify-between gap-8 sm:mb-32 md:flex-row md:items-baseline">
          <h2 className="font-display text-4xl text-foreground sm:text-5xl">
            The Art of <br /> Atmosphere
          </h2>
          <p className="max-w-sm font-label text-xs uppercase leading-relaxed tracking-widest text-muted-foreground">
            A seamless transition from digital concept to hand-wired physical masterpiece.
          </p>
        </div>
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3">
          {PROCESS_STEPS.map((step, i) => (
            <SpotlightCard
              key={step.n}
              className={cn(
                'process-step group border border-border p-12 transition-colors hover:bg-white/5',
                i === 1 && 'md:-mt-12',
              )}
            >
              <span className="pointer-events-none absolute left-4 top-4 select-none font-display text-7xl text-foreground/5 transition-colors group-hover:text-brand/10">
                {step.n}
              </span>
              <div className="relative z-10">
                <h3 className="mb-6 font-display text-2xl text-foreground">{step.title}</h3>
                <p className="mb-8 text-muted-foreground">{step.body}</p>
                <div className="h-px w-8 bg-brand/40" />
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}

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
          <Link
            to="/company-insights"
            className="group flex items-center gap-4 font-label text-xs font-bold uppercase tracking-[0.3em] text-brand"
          >
            <span className="h-px w-12 bg-brand/30 transition-all group-hover:w-16" />
            Speak with a Designer
          </Link>
        </div>
      </div>
    </section>
  );
}
