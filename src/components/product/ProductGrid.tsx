import type { Product } from '../../types';
import { EmptyState } from '../layout/AsyncState';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products, emptyMessage }: { products: Product[]; emptyMessage?: string }) {
  if (products.length === 0) {
    return <EmptyState message={emptyMessage ?? 'No products found.'} />;
  }

  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
