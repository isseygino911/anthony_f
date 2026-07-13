import { useEffect, useState } from 'react';
import { getFavorites } from '../../../api/favorites';
import { ErrorMessage, LoadingGrid } from '../../../components/layout/AsyncState';
import { ProductGrid } from '../../../components/product/ProductGrid';
import type { Product } from '../../../types';

export function Favorites() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFavorites()
      .then((res) => setProducts(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load favorites'));
  }, []);

  return (
    <div className="container flex flex-col gap-8 py-12">
      <h1 className="font-display text-3xl tracking-tight">My Favorites</h1>
      {error && <ErrorMessage message={error} />}
      {products === null && !error && <LoadingGrid count={4} />}
      {products !== null && (
        <ProductGrid products={products} emptyMessage="You haven't favorited any products yet." />
      )}
    </div>
  );
}
