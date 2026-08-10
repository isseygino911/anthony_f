import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminCustomNeonDesigns, setCustomNeonDesignShowcased } from '../../api/admin';
import { NEON_SIZE_LABELS } from '../../api/customNeon';
import { EmptyState, ErrorMessage } from '../../components/layout/AsyncState';
import { DesignStatusBadge } from '../../components/product/DesignStatusBadge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Switch } from '../../components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { formatCurrency } from '../../lib/utils';
import type { CustomNeonDesign } from '../../types';

// listShowcase only ever surfaces a finished design with an un-purged
// preview, so promoting anything else would leave an admin looking at an "on"
// toggle for something that never appears. The server enforces this too.
function canShowcase(design: CustomNeonDesign) {
  return design.status === 'ready' && Boolean(design.generatedImageUrl) && !design.imagesPurgedAt;
}

export function CustomNeonDesigns() {
  const [designs, setDesigns] = useState<CustomNeonDesign[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  function load() {
    getAdminCustomNeonDesigns({ pageSize: 100 })
      .then((res) => setDesigns(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load designs'));
  }

  useEffect(load, []);

  async function handleToggleShowcase(design: CustomNeonDesign) {
    setTogglingId(design.id);
    setError(null);
    try {
      const updated = await setCustomNeonDesignShowcased(design.id, !design.isShowcased);
      setDesigns((prev) => prev?.map((d) => (d.id === updated.id ? updated : d)) ?? prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update gallery visibility');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Custom Neon Designs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Designs are hidden from the storefront galleries until you show them here.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      {designs === null && !error && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {designs !== null && designs.length === 0 && <EmptyState message="No custom designs submitted yet." />}

      {designs !== null && designs.length > 0 && (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size / Color</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gallery</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {designs.map((design) => (
                  <TableRow key={design.id}>
                    <TableCell>
                      {design.generatedImageUrl ? (
                        <img
                          src={design.generatedImageUrl}
                          alt=""
                          className="h-12 w-12 rounded-md border object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-md border bg-muted" />
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{design.designType}</TableCell>
                    <TableCell className="capitalize">
                      {design.size ? `${NEON_SIZE_LABELS[design.size]} / ${design.neonColor}` : '—'}
                    </TableCell>
                    <TableCell>{design.price !== null ? formatCurrency(design.price) : '—'}</TableCell>
                    <TableCell>
                      <DesignStatusBadge status={design.status} />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={design.isShowcased}
                        onCheckedChange={() => handleToggleShowcase(design)}
                        disabled={togglingId === design.id || !canShowcase(design)}
                        aria-label={`Show design ${design.id} in the storefront galleries`}
                      />
                    </TableCell>
                    {/* A design only has a product_id once a customer confirmed
                        it into an order. Everything else that has a usable
                        preview can still be published as a catalog product by
                        an admin, regardless of who generated it. */}
                    <TableCell>
                      {design.productId ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/admin/products/${design.productId}`}>Product</Link>
                        </Button>
                      ) : design.status === 'ready' && design.generatedImageUrl ? (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/products/new?designId=${design.id}`}>Create product</Link>
                        </Button>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/custom-neon-designs/${design.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* The card is deliberately not wrapped in a Link — the gallery
              switch lives inside it, and a tap on the switch must not
              navigate. Only the title links through. */}
          <div className="flex flex-col gap-3 md:hidden">
            {designs.map((design) => (
              <div key={design.id} className="flex flex-col gap-3 rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  {design.generatedImageUrl ? (
                    <img src={design.generatedImageUrl} alt="" className="h-12 w-12 shrink-0 rounded-md border object-cover" />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded-md border bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/custom-neon-designs/${design.id}`} className="font-medium capitalize hover:underline">
                      {design.designType} {design.size ? `— ${NEON_SIZE_LABELS[design.size]}` : ''}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {design.price !== null ? formatCurrency(design.price) : 'Not confirmed yet'}
                    </p>
                  </div>
                  <DesignStatusBadge status={design.status} />
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-sm text-muted-foreground">Show in gallery</span>
                  <Switch
                    checked={design.isShowcased}
                    onCheckedChange={() => handleToggleShowcase(design)}
                    disabled={togglingId === design.id || !canShowcase(design)}
                    aria-label={`Show design ${design.id} in the storefront galleries`}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
