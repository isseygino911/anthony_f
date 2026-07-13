import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getMyOrder, getMyOrders } from '../../../api/orders';
import { EmptyState, ErrorMessage } from '../../../components/layout/AsyncState';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { formatCurrency } from '../../../lib/utils';
import type { Order, OrderSummary } from '../../../types';

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  pending_payment: 'warning',
  processing: 'default',
  shipped: 'default',
  delivered: 'success',
  cancelled: 'destructive',
  refunded: 'secondary',
};

export function Orders() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Order | null>(null);

  useEffect(() => {
    getMyOrders({ page: 1, pageSize: 50 })
      .then((res) => setOrders(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load orders'));
  }, []);

  async function toggleExpand(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setDetail(null);
    try {
      const order = await getMyOrder(id);
      setDetail(order);
    } catch {
      setDetail(null);
    }
  }

  return (
    <div className="container flex flex-col gap-8 py-12">
      <h1 className="font-display text-3xl tracking-tight">My Orders</h1>
      {error && <ErrorMessage message={error} />}
      {orders === null && !error && (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}
      {orders !== null && orders.length === 0 && <EmptyState message="You haven't placed any orders yet." />}
      {orders !== null && orders.length > 0 && (
        <div className="flex flex-col gap-2">
          {orders.map((order) => (
            <div key={order.id} className="rounded-md border border-border/70 bg-card">
              <button
                className="flex w-full items-center justify-between p-5 text-left"
                onClick={() => toggleExpand(order.id)}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">Order #{order.id}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={STATUS_VARIANT[order.status] ?? 'default'}>
                    {order.status.replace('_', ' ')}
                  </Badge>
                  <span className="font-medium">{formatCurrency(order.total)}</span>
                  {expandedId === order.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {expandedId === order.id && (
                <div className="border-t border-border/70 p-5">
                  {!detail && <Skeleton className="h-16 w-full" />}
                  {detail && (
                    <div className="flex flex-col gap-1 text-sm">
                      {detail.items.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span>
                            {item.label}
                            {item.quantity ? ` × ${item.quantity}` : ''}
                          </span>
                          <span>
                            {formatCurrency(item.unit_price ? item.unit_price * (item.quantity ?? 1) : (item.amount ?? 0))}
                          </span>
                        </div>
                      ))}
                      <div className="mt-2 flex justify-between border-t border-border/70 pt-2 font-semibold">
                        <span>Total</span>
                        <span>{formatCurrency(detail.adjustedTotal ?? detail.total)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
