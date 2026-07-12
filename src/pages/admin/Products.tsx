import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bulkDeleteProducts } from '../../api/admin';
import { getProducts } from '../../api/products';
import { EmptyState, ErrorMessage } from '../../components/layout/AsyncState';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Skeleton } from '../../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { formatCurrency } from '../../lib/utils';
import type { Product } from '../../types';

export function Products() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  function load() {
    setProducts(null);
    getProducts({ pageSize: 100 })
      .then((res) => setProducts(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load products'));
  }

  useEffect(load, []);

  function toggleSelected(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!products) return;
    setSelected((prev) => (prev.size === products.length ? new Set() : new Set(products.map((p) => p.id))));
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Soft-delete ${selected.size} product(s)?`)) return;
    setDeleting(true);
    try {
      await bulkDeleteProducts(Array.from(selected));
      setSelected(new Set());
      load();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} disabled={deleting}>
              Delete selected ({selected.size})
            </Button>
          )}
          <Button asChild>
            <Link to="/admin/products/new">
              <Plus className="h-4 w-4" /> New product
            </Link>
          </Button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {products === null && !error && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {products !== null && products.length === 0 && <EmptyState message="No products yet." />}

      {products !== null && products.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={selected.size === products.length} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(product.id)}
                    onCheckedChange={() => toggleSelected(product.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell>{formatCurrency(product.price)}</TableCell>
                <TableCell>{product.stock_quantity ?? '—'}</TableCell>
                <TableCell className="flex flex-wrap gap-1">
                  {product.is_featured && <Badge variant="secondary">Featured</Badge>}
                  {product.is_bestseller && <Badge variant="secondary">Bestseller</Badge>}
                  {product.is_clearance && <Badge variant="warning">Clearance</Badge>}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/admin/products/${product.id}`}>Edit</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
