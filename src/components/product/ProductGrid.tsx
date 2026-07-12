import type { Product } from '../../types';
import { EmptyState } from '../layout/AsyncState';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products, emptyMessage }: { products: Product[]; emptyMessage?: string }) {
  if (products.length === 0) {
    return <EmptyState message={emptyMessage ?? 'No products found.'} />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
