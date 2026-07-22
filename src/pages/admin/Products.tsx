import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bulkDeleteProducts, setProductActive } from '../../api/admin';
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
  const [togglingId, setTogglingId] = useState<number | null>(null);

  function load() {
    setProducts(null);
    getProducts({ pageSize: 100, includeInactive: true })
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

  async function handleToggleActive(product: Product) {
    const nextActive = product.is_active === false;
    if (!nextActive && !confirm(`Take down "${product.name}" from the storefront?`)) return;
    setTogglingId(product.id);
    try {
      await setProductActive(product.id, nextActive);
      load();
    } finally {
      setTogglingId(null);
    }
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
        <>
          {/* Desktop/tablet: full data table (unchanged). */}
          <div className="hidden md:block">
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
                      {product.is_active === false && <Badge variant="destructive">Disabled</Badge>}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/products/${product.id}`}>Edit</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(product)}
                        disabled={togglingId === product.id}
                      >
                        {product.is_active === false ? 'Enable' : 'Disable'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: card list — same state/handlers as the table above. */}
          <div className="flex flex-col gap-3 md:hidden">
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                checked={selected.size === products.length}
                onCheckedChange={toggleAll}
                aria-label="Select all products"
              />
              <span className="text-sm text-muted-foreground">Select all</span>
            </div>
            {products.map((product) => (
              <div key={product.id} className="rounded-lg border p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    className="mt-0.5"
                    checked={selected.has(product.id)}
                    onCheckedChange={() => toggleSelected(product.id)}
                    aria-label={`Select ${product.name}`}
                  />
                  <p className="min-w-0 flex-1 font-medium leading-snug">{product.name}</p>
                  <Button variant="ghost" size="sm" asChild className="shrink-0">
                    <Link to={`/admin/products/${product.id}`}>Edit</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => handleToggleActive(product)}
                    disabled={togglingId === product.id}
                  >
                    {product.is_active === false ? 'Enable' : 'Disable'}
                  </Button>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 pl-7 text-xs text-muted-foreground">
                  <span>{product.sku}</span>
                  <span>{formatCurrency(product.price)}</span>
                  <span>Stock: {product.stock_quantity ?? '—'}</span>
                </div>
                {(product.is_featured || product.is_bestseller || product.is_clearance || product.is_active === false) && (
                  <div className="mt-2 flex flex-wrap gap-1 pl-7">
                    {product.is_featured && <Badge variant="secondary">Featured</Badge>}
                    {product.is_bestseller && <Badge variant="secondary">Bestseller</Badge>}
                    {product.is_clearance && <Badge variant="warning">Clearance</Badge>}
                    {product.is_active === false && <Badge variant="destructive">Disabled</Badge>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
