import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { getShowcaseDesigns, type ShowcaseDesign } from '../../api/customNeon';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { Draggable, gsap, prefersReducedMotion } from '../../lib/motion';

// Shown until the real custom-neon designs load (or if that fetch fails) —
// same demo photography the rest of the storefront falls back to.
const FALLBACK_ITEMS: ShowcaseDesign[] = [
  { id: -1, label: 'Eevee outline · cyan', dimensions: null, imageUrl: '/assets/neon-gallery-1.png' },
  { id: -2, label: 'Jigglypuff outline · pink', dimensions: null, imageUrl: '/assets/neon-gallery-2.png' },
  { id: -3, label: 'Charmander outline · orange', dimensions: null, imageUrl: '/assets/neon-gallery-4.png' },
  { id: -4, label: 'Pikachu outline · yellow', dimensions: null, imageUrl: '/assets/neon-gallery-5.png' },
];

export function EditorialGallery() {
  const [items, setItems] = useState<ShowcaseDesign[]>(FALLBACK_ITEMS);
  const headRef = useScrollReveal<HTMLDivElement>();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getShowcaseDesigns(10)
      .then((res) => {
        if (res.items.length > 0) setItems(res.items);
      })
      .catch(() => {
        // Keep the fallback demo images.
      });
  }, []);

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
          scrollTrigger: { trigger: viewportRef.current, start: 'top 82%' },
        });
      }

      // Draggable, inertia-scrolling carousel — bounded to however far the
      // track actually overflows its viewport (recomputed per items/width).
      const overflow = trackRef.current.scrollWidth - viewportRef.current.clientWidth;
      if (overflow <= 0) return;

      Draggable.create(trackRef.current, {
        type: 'x',
        inertia: true,
        bounds: { minX: -overflow, maxX: 0 },
        edgeResistance: 0.85,
        cursor: 'grab',
        activeCursor: 'grabbing',
      });
    },
    { scope: viewportRef, dependencies: [items], revertOnUpdate: true },
  );

  return (
    <section id="gallery" className="relative overflow-hidden bg-background py-32 sm:py-40">
      <div className="container">
        <div ref={headRef} className="relative mb-16">
          <span className="mb-4 block font-label text-xs uppercase tracking-[0.5em] text-brand">
            Selected Works
          </span>
          <h2 className="font-display text-5xl leading-none text-foreground sm:text-7xl">The Signature Series</h2>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Ten real designs straight from the neon studio &mdash; drag to browse.
          </p>
        </div>
      </div>

      <div ref={viewportRef} className="cursor-grab overflow-hidden active:cursor-grabbing">
        <div ref={trackRef} className="flex gap-6 px-6 will-change-transform sm:px-10 md:px-16">
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
