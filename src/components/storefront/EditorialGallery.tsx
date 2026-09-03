import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { EXAMPLE_DESIGNS } from '../../api/customNeon';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { Draggable, gsap, prefersReducedMotion } from '../../lib/motion';

// The signature series is a fixed set of studio examples, not a feed. Customer
// designs an admin has promoted appear in Community Creations on /custom-neon
// instead, so this strip never changes and never renders empty.
const items = EXAMPLE_DESIGNS;

export function EditorialGallery() {
  const headRef = useScrollReveal<HTMLDivElement>();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  // Whether the strip fits its viewport, i.e. there is nothing to drag. Drives
  // the centring: a strip that fits is centred, one that overflows starts flush
  // left so no card is stranded off-screen.
  const [fits, setFits] = useState(false);

  useGSAP(
    () => {
      if (!viewportRef.current || !trackRef.current) return;

      if (!prefersReducedMotion()) {
        gsap.from(trackRef.current.querySelectorAll('.gallery-card'), {
          opacity: 0,
          y: 24,
          duration: 0.8,
          stagger: 0.08,
          ease: 'power3.out',
          // See useStaggerReveal — without these a `from` whose trigger hasn't
          // fired leaves the cards stuck at opacity:0.
          immediateRender: false,
          scrollTrigger: { trigger: viewportRef.current, start: 'top 82%', invalidateOnRefresh: true },
        });
      }

      // Draggable, inertia-scrolling carousel — bounded to however far the
      // track actually overflows its viewport.
      //
      // The instance is created unconditionally rather than only when the track
      // currently overflows: at mount that measurement can legitimately be 0
      // (layout not yet settled), and bailing out there left the carousel dead
      // for the life of the page. Bounds are recomputed on resize instead.
      const measure = () =>
        Math.max(0, (trackRef.current?.scrollWidth ?? 0) - (viewportRef.current?.clientWidth ?? 0));

      const [drag] = Draggable.create(trackRef.current, {
        type: 'x',
        inertia: true,
        bounds: { minX: -measure(), maxX: 0 },
        edgeResistance: 0.85,
        cursor: 'grab',
        activeCursor: 'grabbing',
        // Let a mostly-vertical gesture fall through to native page scrolling
        // rather than being swallowed as a horizontal drag.
        allowNativeTouchScrolling: true,
      });

      const applyBounds = () => {
        const overflow = measure();
        setFits(overflow <= 0);
        drag.applyBounds({ minX: -overflow, maxX: 0 });
        // Nothing to drag (wide screens): disable so the grab cursor and drag
        // affordance do not appear on a strip that cannot move.
        if (overflow <= 0) drag.disable();
        else if (!drag.enabled()) drag.enable();
      };

      applyBounds();

      const observer = new ResizeObserver(applyBounds);
      observer.observe(viewportRef.current);
      observer.observe(trackRef.current);

      return () => {
        observer.disconnect();
        drag.kill();
      };
    },
    { scope: viewportRef },
  );

  /*
   * min-w-0 on the section: it is a flex item, and a flex item defaults to
   * min-width:auto — it refuses to shrink below the intrinsic width of the card
   * track, so on mobile the section blew out to the track's full width (1344px
   * inside a 390px screen). That also silently disabled the carousel: the
   * Draggable below is only created when the track overflows its viewport, and
   * an oversized viewport makes that overflow compute to 0.
   */
  return (
    <section id="gallery" className="relative min-w-0 overflow-hidden bg-background py-32 sm:py-40">
      <div className="container">
        <div ref={headRef} className="relative mb-16">
          <span className="mb-4 block font-label text-xs uppercase tracking-[0.5em] text-brand">
            Selected Works
          </span>
          <h2 className="font-display text-5xl leading-none text-foreground sm:text-7xl">The Signature Series</h2>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Real designs straight from the neon studio &mdash; drag to browse.
          </p>
        </div>
      </div>

      <div ref={viewportRef} className="cursor-grab overflow-hidden active:cursor-grabbing">
        {/* justify-center only while the strip fits: with real overflow it would
            push the leading cards off the left edge, out of reach of the drag. */}
        <div
          ref={trackRef}
          className={`flex gap-6 px-6 will-change-transform sm:px-10 md:px-16 ${fits ? 'justify-center' : ''}`}
        >
          {items.map((item) => (
            <figure
              key={item.id}
              className="gallery-card group relative aspect-[3/4] w-[240px] flex-none select-none overflow-hidden rounded-2xl border border-border sm:w-[300px]"
            >
              <img
                src={item.imageUrl}
                alt={item.label}
                draggable={false}
                className="h-full w-full scale-105 object-cover grayscale transition-all duration-1000 group-hover:scale-100 group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <figcaption className="absolute inset-x-4 bottom-4">
                <span className="text-xs uppercase tracking-widest text-white/80">{item.label}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
