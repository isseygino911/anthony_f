import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../../api/client';
import { NEON_SIZE_LABELS, confirmDesign, listMyDesigns } from '../../../api/customNeon';
import { EmptyState, ErrorMessage } from '../../../components/layout/AsyncState';
import { DesignStatusBadge } from '../../../components/product/DesignStatusBadge';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { useCart } from '../../../hooks/useCart';
import { formatCurrency } from '../../../lib/utils';
import type { CustomNeonDesign } from '../../../types';

export function MyDesigns() {
  const navigate = useNavigate();
  const { refresh: refreshCart } = useCart();

  const [designs, setDesigns] = useState<CustomNeonDesign[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderingId, setOrderingId] = useState<number | null>(null);

  useEffect(() => {
    listMyDesigns({ page: 1, pageSize: 50 })
      .then((res) => setDesigns(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load designs'));
  }, []);

  async function handleOrder(id: number) {
    setError(null);
    setOrderingId(id);
    try {
      await confirmDesign(id);
      await refreshCart();
      navigate('/cart');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add design to cart');
    } finally {
      setOrderingId(null);
    }
  }

  return (
    <div className="container flex flex-col gap-8 py-12">
      <h1 className="font-display text-3xl tracking-tight">My Designs</h1>
      {error && <ErrorMessage message={error} />}

      {designs === null && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      )}

      {designs !== null && designs.length === 0 && (
        <EmptyState message="You haven't generated any custom neon designs yet." />
      )}

      {designs !== null && designs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {designs.map((design) => {
            const isReady = design.status === 'ready';
            const alreadyOrdered = Boolean(design.productId);
            const isOrdering = orderingId === design.id;
            return (
              <div key={design.id} className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card p-4">
                <div className="aspect-square overflow-hidden rounded-md border bg-muted">
                  {design.generatedImageUrl ? (
                    <img src={design.generatedImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No preview yet
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium capitalize">{design.designType} design</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {design.size ? `${NEON_SIZE_LABELS[design.size]} · ${design.neonColor}` : '—'}
                    </p>
                  </div>
                  <DesignStatusBadge status={design.status} />
                </div>

                {design.price !== null && (
                  <p className="text-sm font-medium">{formatCurrency(design.price)}</p>
                )}

                {isReady && (
                  <Button size="sm" disabled={isOrdering} onClick={() => handleOrder(design.id)}>
                    {isOrdering ? 'Adding…' : alreadyOrdered ? 'Order Again' : 'Add to Cart'}
                  </Button>
                )}

                {design.status === 'failed' && (
                  <p className="text-xs text-destructive">Generation failed — try creating a new design.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
