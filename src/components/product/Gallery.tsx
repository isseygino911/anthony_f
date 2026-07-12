import { useState } from 'react';
import { cn } from '../../lib/utils';
import type { ProductImage } from '../../types';

export function Gallery({ images, alt }: { images: ProductImage[]; alt: string }) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex];

  if (sorted.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-muted text-muted-foreground">
        No image available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
        <img src={active.url} alt={alt} className="h-full w-full object-cover" />
      </div>
      {sorted.length > 1 && (
        <div className="flex gap-2">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={cn(
                'h-16 w-16 shrink-0 overflow-hidden rounded-md border-2',
                i === activeIndex ? 'border-brand' : 'border-transparent',
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
