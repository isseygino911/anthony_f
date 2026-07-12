import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getGroupProducts, getGroups } from '../../api/products';
import { ErrorMessage, LoadingGrid } from '../../components/layout/AsyncState';
import { SectionSurface } from '../../components/layout/SectionSurface';
import { ProductGrid } from '../../components/product/ProductGrid';
import { useTheme } from '../../hooks/useTheme';
import type { Product, ProductGroup } from '../../types';

export function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const [group, setGroup] = useState<ProductGroup | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setProducts(null);
    setError(null);

    getGroups()
      .then((res) => {
        if (!cancelled) setGroup(res.items.find((g) => String(g.id) === id) ?? null);
      })
      .catch(() => undefined);

    getGroupProducts(id, { pageSize: 48 })
      .then((res) => {
        if (!cancelled) setProducts(res.items);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load group products');
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="flex flex-col">
      <SectionSurface variant={theme?.section_styles.groupBanner ?? 'gradient'}>
        <div className="container flex flex-col gap-1 py-12">
          <h1 className="text-3xl font-semibold">{group?.name ?? 'Group'}</h1>
          {group?.description && <p className="opacity-90">{group.description}</p>}
        </div>
      </SectionSurface>

      <div className="container py-8">
        {error && <ErrorMessage message={error} />}
        {products === null && !error && <LoadingGrid count={8} />}
        {products !== null && <ProductGrid products={products} />}
      </div>
    </div>
  );
}
