import { useState } from 'react';
import { cn } from '../../lib/utils';
import type { ProductImage } from '../../types';

export function Gallery({ images, alt }: { images: ProductImage[]; alt: string }) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex];

  if (sorted.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-muted text-muted-foreground">
        No image available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="aspect-square overflow-hidden bg-muted">
        <img src={active.url} alt={alt} className="h-full w-full object-cover" />
      </div>
      {sorted.length > 1 && (
        <div className="flex gap-3">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={cn(
                'h-16 w-16 shrink-0 overflow-hidden border transition-colors',
                i === activeIndex ? 'border-foreground' : 'border-border/70 hover:border-foreground/40',
              )}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
