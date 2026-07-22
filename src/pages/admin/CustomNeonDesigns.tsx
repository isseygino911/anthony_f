import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminCustomNeonDesigns } from '../../api/admin';
import { NEON_SIZE_LABELS } from '../../api/customNeon';
import { EmptyState, ErrorMessage } from '../../components/layout/AsyncState';
import { DesignStatusBadge } from '../../components/product/DesignStatusBadge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { formatCurrency } from '../../lib/utils';
import type { CustomNeonDesign } from '../../types';

export function CustomNeonDesigns() {
  const [designs, setDesigns] = useState<CustomNeonDesign[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminCustomNeonDesigns({ pageSize: 100 })
      .then((res) => setDesigns(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load designs'));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Custom Neon Designs</h1>

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
                  <TableHead>Order</TableHead>
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
                      {design.productId ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/admin/products/${design.productId}`}>Product</Link>
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

          <div className="flex flex-col gap-3 md:hidden">
            {designs.map((design) => (
              <Link
                key={design.id}
                to={`/admin/custom-neon-designs/${design.id}`}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                {design.generatedImageUrl ? (
                  <img src={design.generatedImageUrl} alt="" className="h-12 w-12 shrink-0 rounded-md border object-cover" />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-md border bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium capitalize">
                    {design.designType} {design.size ? `— ${NEON_SIZE_LABELS[design.size]}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {design.price !== null ? formatCurrency(design.price) : 'Not confirmed yet'}
                  </p>
                </div>
                <DesignStatusBadge status={design.status} />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
