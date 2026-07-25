import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cancelOrder, createPaymentIntent, getMyOrder, getMyOrders } from '../../../api/orders';
import { EmptyState, ErrorMessage } from '../../../components/layout/AsyncState';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { formatCurrency } from '../../../lib/utils';
import type { Order, OrderSummary } from '../../../types';
import { PaymentStep } from '../PaymentStep';

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
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payment, setPayment] = useState<{ orderId: number; clientSecret: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  function loadOrders() {
    getMyOrders({ page: 1, pageSize: 50 })
      .then((res) => setOrders(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load orders'));
  }

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

  async function handlePay(id: number) {
    setActionError(null);
    setPayingId(id);
    try {
      const { clientSecret } = await createPaymentIntent(id);
      setPayment({ orderId: id, clientSecret });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to start payment');
      setPayingId(null);
    }
  }

  async function handleCancel(id: number) {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setActionError(null);
    setCancellingId(id);
    try {
      await cancelOrder(id);
      setOrders((prev) => prev?.filter((o) => o.id !== id) ?? prev);
      if (expandedId === id) {
        setExpandedId(null);
        setDetail(null);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  }

  function handlePaid() {
    setPayment(null);
    setPayingId(null);
    loadOrders();
  }

  return (
    <div className="container flex flex-col gap-8 py-12">
      <h1 className="font-display text-3xl tracking-tight">My Orders</h1>
      {error && <ErrorMessage message={error} />}
      {actionError && <ErrorMessage message={actionError} />}
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

              {order.status === 'pending_payment' && (
                <div className="flex items-center gap-3 border-t border-border/70 px-5 py-3">
                  {payingId === order.id && payment?.orderId === order.id ? (
                    <div className="w-full max-w-md">
                      <PaymentStep
                        orderId={payment.orderId}
                        clientSecret={payment.clientSecret}
                        onPaid={handlePaid}
                      />
                    </div>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handlePay(order.id)}
                        disabled={payingId === order.id || cancellingId === order.id}
                      >
                        {payingId === order.id ? 'Loading...' : 'Pay now'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(order.id)}
                        disabled={cancellingId === order.id || payingId === order.id}
                      >
                        {cancellingId === order.id ? 'Cancelling...' : 'Cancel order'}
                      </Button>
                    </>
                  )}
                </div>
              )}

              {expandedId === order.id && (
                <div className="border-t border-border/70 p-5">
                  {!detail && <Skeleton className="h-16 w-full" />}
                  {detail && (
                    <div className="flex flex-col gap-4 text-sm">
                      <div className="flex flex-col gap-1">
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
                        <div className="mt-2 flex flex-col gap-1 border-t border-border/70 pt-2">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{formatCurrency(detail.subtotal)}</span>
                          </div>
                          {detail.adjustment_total !== 0 && (
                            <div className="flex justify-between">
                              <span>Adjustments</span>
                              <span>{formatCurrency(detail.adjustment_total)}</span>
                            </div>
                          )}
                          {detail.tax_amount > 0 && (
                            <div className="flex justify-between">
                              <span>Tax ({detail.tax_rate_percent.toFixed(2)}%)</span>
                              <span>{formatCurrency(detail.tax_amount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span>{formatCurrency(detail.adjustedTotal ?? detail.total)}</span>
                          </div>
                        </div>
                      </div>

                      {detail.shipping_address && (
                        <div className="border-t border-border/70 pt-3">
                          <div className="mb-1 font-medium">Shipping address</div>
                          <div className="text-muted-foreground">
                            <div>{detail.shipping_address.recipient_name}</div>
                            <div>
                              {detail.shipping_address.line1}
                              {detail.shipping_address.line2 ? `, ${detail.shipping_address.line2}` : ''}
                            </div>
                            <div>
                              {detail.shipping_address.city}, {detail.shipping_address.region}{' '}
                              {detail.shipping_address.postal_code}
                            </div>
                            <div>{detail.shipping_address.country}</div>
                          </div>
                        </div>
                      )}

                      {detail.stripe_payment_intent_id && (
                        <div className="border-t border-border/70 pt-3">
                          <div className="mb-1 font-medium">Payment</div>
                          <div className="break-all text-muted-foreground">
                            Transaction ID: {detail.stripe_payment_intent_id}
                          </div>
                        </div>
                      )}
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
