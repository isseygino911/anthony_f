import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getCategories, getProducts } from '../../api/products';
import { ErrorMessage, LoadingGrid } from '../../components/layout/AsyncState';
import { ProductGrid } from '../../components/product/ProductGrid';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import type { Category, Product } from '../../types';

const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
];

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = searchParams.get('search') ?? '';
  const sort = searchParams.get('sort') ?? '';
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.items))
      .catch(() => setCategories([]));
  }, []);

  // Debounce the search box -> URL param -> refetch, instead of firing a
  // request on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => updateParam('search', searchInput), 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setProducts(null);
    getProducts({ category: slug, search: search || undefined, sort: sort || undefined, pageSize: 48 })
      .then((res) => {
        if (!cancelled) setProducts(res.items);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load products');
      });
    return () => {
      cancelled = true;
    };
  }, [slug, search, sort]);

  const activeCategory = categories.find((c) => c.slug === slug);
  const title = activeCategory?.name ?? (slug ? slug : 'All Products');

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <div className="container flex flex-col gap-6 py-8">
      <h1 className="text-2xl font-semibold">{title}</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          value={sort || 'relevance'}
          onValueChange={(v) => updateParam('sort', v === 'relevance' ? '' : v)}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value || 'relevance'} value={opt.value || 'relevance'}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <ErrorMessage message={error} />}
      {products === null && !error && <LoadingGrid count={8} />}
      {products !== null && <ProductGrid products={products} />}
    </div>
  );
}
