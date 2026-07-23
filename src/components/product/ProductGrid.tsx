import type { Product } from '../../types';
import { useStaggerReveal } from '../../hooks/useStaggerReveal';
import { EmptyState } from '../layout/AsyncState';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products, emptyMessage }: { products: Product[]; emptyMessage?: string }) {
  const gridRef = useStaggerReveal<HTMLDivElement>('.product-card-item', [products.length]);

  if (products.length === 0) {
    return <EmptyState message={emptyMessage ?? 'No products found.'} />;
  }

  return (
    <div ref={gridRef} className="grid grid-cols-1 gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <div key={product.id} className="product-card-item">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
