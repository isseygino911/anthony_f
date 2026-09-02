import { ChevronDown } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useStaggerReveal } from '../../hooks/useStaggerReveal';

// Answers describe how the studio actually works today — the three fixed
// sizes, the AI proof step on /custom-neon, the materials named in Process.
// Keep them in sync with those surfaces rather than adding claims here.
const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'How long does a custom sign take?',
    a: 'Most pieces are hand-built and shipped within three to five business days of you approving the design. Larger commercial runs and multi-line work can take a little longer — we will tell you before you commit.',
  },
  {
    q: 'Can you make my logo or handwriting into a sign?',
    a: 'Yes. Upload a logo or vector file in the design tool, or draw directly on the canvas and we will trace it. Anything with a clean outline works well; very fine detail may need to be simplified to survive as a physical tube.',
  },
  {
    q: 'What sizes can I order?',
    a: 'The design tool offers three square formats — 12", 24" and 36". If you need a bespoke footprint for a wall or a storefront, start a conversation with a designer and we will quote it directly.',
  },
  {
    q: 'Is it safe indoors, around children and pets?',
    a: 'Yes. Every sign runs on low-voltage 12V and stays cool to the touch, with no glass to break and no gas inside. Standard builds are made for indoor use; ask us if you need an outdoor-rated finish.',
  },
  {
    q: 'How do I hang it?',
    a: 'Each sign ships with the mounting hardware for its backing, and the acrylic is pre-drilled so you can hang it flush or on standoffs. Nothing more than a drill and a level is needed.',
  },
  {
    q: 'Can I dim it?',
    a: 'Every sign includes a dimmer so you can take it from full brightness down to a low ambient glow.',
  },
  {
    q: 'What happens after I submit a design?',
    a: 'You will see a preview of your sign before anything is charged or built. Approve it and the piece goes into fabrication; ask for changes and you can adjust the size or colour and preview it again.',
  },
];

export function FaqSection() {
  const headRef = useScrollReveal<HTMLDivElement>();
  const listRef = useStaggerReveal<HTMLDivElement>('.faq-item');

  return (
    <section aria-labelledby="faq-heading" className="bg-card py-32 sm:py-40">
      <div className="container grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
        <div ref={headRef}>
          <span className="mb-6 inline-flex items-center border-l-2 border-brand pl-4 font-label text-xs uppercase tracking-[0.4em] text-brand">
            Questions
          </span>
          <h2 id="faq-heading" className="font-display text-4xl leading-[0.95] text-foreground sm:text-5xl">
            Before You
            <br />
            <span className="brand-text-gradient">Commission</span>
          </h2>
        </div>

        <div ref={listRef}>
          {FAQ_ITEMS.map((item) => (
            // Native <details> is a disclosure widget already: keyboard
            // operable, correctly announced, and open by default without JS.
            <details key={item.q} name="faq" className="faq-item group border-b border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-display text-lg text-foreground transition-colors hover:text-brand [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown
                  aria-hidden
                  className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180"
                />
              </summary>
              <p className="pb-8 pr-10 leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
