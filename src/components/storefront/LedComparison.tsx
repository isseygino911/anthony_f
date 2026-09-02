import { Check, X } from 'lucide-react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../ui/table';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useStaggerReveal } from '../../hooks/useStaggerReveal';

// Specs for LED silicone flex vs traditional pumped-glass neon. These are
// marketing claims the studio stands behind, so keep them to the properties of
// the technology itself rather than anything order-specific.
const COMPARISON_ROWS: { trait: string; led: string; glass: string }[] = [
  {
    trait: 'Durability',
    led: 'Shatterproof silicone — flexes rather than breaks',
    glass: 'Fragile glass tubing, cracks on impact',
  },
  {
    trait: 'Sound',
    led: 'Completely silent in operation',
    glass: 'Audible transformer hum',
  },
  {
    trait: 'Energy use',
    led: 'Around 80% less power draw',
    glass: 'High-voltage, power hungry',
  },
  {
    trait: 'Safety',
    led: 'Cool to the touch, low-voltage 12V',
    glass: 'Runs hot at thousands of volts',
  },
  {
    trait: 'Lifespan',
    led: '50,000+ hours of rated life',
    glass: 'Roughly 10,000 hours before dimming',
  },
  {
    trait: 'Shipping',
    led: 'Travels worldwide with minimal risk',
    glass: 'High breakage rate in transit',
  },
];

export function LedComparison() {
  const headRef = useScrollReveal<HTMLDivElement>();
  const bodyRef = useStaggerReveal<HTMLTableSectionElement>('.comparison-row');

  return (
    <section
      aria-labelledby="comparison-heading"
      className="border-y border-border bg-background py-32 sm:py-40"
    >
      <div className="container">
        <div ref={headRef} className="mb-16 max-w-2xl">
          <span className="mb-6 inline-flex items-center border-l-2 border-brand pl-4 font-label text-xs uppercase tracking-[0.4em] text-brand">
            The Difference
          </span>
          <h2 id="comparison-heading" className="font-display text-4xl leading-[0.95] text-foreground sm:text-5xl">
            Modern LED,
            <br />
            Not <span className="brand-text-gradient">Fragile Glass</span>
          </h2>
          <p className="mt-8 max-w-md text-muted-foreground">
            Every sign we build uses silicone-encased LED instead of pumped glass tubing. Here is what that
            changes.
          </p>
        </div>

        <Table className="border-collapse">
          <caption className="sr-only">
            Comparison of LED silicone neon against traditional glass neon across durability, sound, energy
            use, safety, lifespan and shipping.
          </caption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="w-[22%] font-label text-xs uppercase tracking-[0.2em]">
                <span className="sr-only">Property</span>
              </TableHead>
              <TableHead
                scope="col"
                className="font-label text-xs uppercase tracking-[0.2em] text-brand"
                style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)' }}
              >
                Our LED neon
              </TableHead>
              <TableHead scope="col" className="font-label text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Traditional glass
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody ref={bodyRef}>
            {COMPARISON_ROWS.map((row) => (
              <TableRow key={row.trait} className="comparison-row hover:bg-transparent">
                <th
                  scope="row"
                  className="p-4 text-left align-top font-label text-xs uppercase tracking-[0.2em] text-muted-foreground"
                >
                  {row.trait}
                </th>
                <td
                  className="p-4 align-top text-foreground"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)' }}
                >
                  <span className="flex gap-3">
                    <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    {row.led}
                  </span>
                </td>
                <td className="p-4 align-top text-muted-foreground">
                  <span className="flex gap-3">
                    <X aria-hidden className="mt-0.5 h-4 w-4 shrink-0 opacity-50" />
                    {row.glass}
                  </span>
                </td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
