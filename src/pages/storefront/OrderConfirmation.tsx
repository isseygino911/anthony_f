import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMyOrder } from '../../api/orders';
import { ErrorMessage } from '../../components/layout/AsyncState';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { formatCurrency } from '../../lib/utils';
import type { Order } from '../../types';

export function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getMyOrder(id)
      .then(setOrder)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load order'));
  }, [id]);

  // The order is created as pending_payment and only flips to processing once
  // Stripe's webhook lands — which happens asynchronously, separate from the
  // client's stripe.confirmPayment() call that brought the user to this page.
  // Poll briefly so the page catches up once the webhook arrives, instead of
  // permanently showing a stale "pending payment" from a one-time fetch.
  useEffect(() => {
    if (!id || !order || order.status !== 'pending_payment') return;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - startedAt > 30000) {
        clearInterval(interval);
        return;
      }
      getMyOrder(id)
        .then(setOrder)
        .catch(() => {
          // transient poll failure — next tick will retry within the 30s cap
        });
    }, 3000);
    return () => clearInterval(interval);
  }, [id, order]);

  if (error) {
    return (
      <div className="container py-8">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-8">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="container flex max-w-xl flex-col items-center gap-5 py-20 text-center">
      <CheckCircle2 className="h-12 w-12 text-emerald-600" />
      <h1 className="font-display text-3xl tracking-tight">Thank you for your order!</h1>
      <p className="text-muted-foreground">
        Order #{order.id} has been placed and is <strong>{order.status.replace('_', ' ')}</strong>.
      </p>

      <div className="w-full rounded-md border border-border/70 bg-card p-6 text-left">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between py-1 text-sm">
            <span>
              {item.label}
              {item.quantity ? ` × ${item.quantity}` : ''}
            </span>
            <span>{formatCurrency(item.unit_price ? item.unit_price * (item.quantity ?? 1) : (item.amount ?? 0))}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-border/70 pt-2 font-semibold">
          <span>Total</span>
          <span>{formatCurrency(order.adjustedTotal ?? order.total)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button asChild>
          <Link to="/account/orders">View my orders</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
