import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { adjustOrder, getAdminOrder } from '../../api/admin';
import type { OrderAdjustmentType } from '../../api/admin';
import { ErrorMessage } from '../../components/layout/AsyncState';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { Textarea } from '../../components/ui/textarea';
import { formatCurrency } from '../../lib/utils';
import type { AdminOrder, OrderStatus } from '../../types';

const ADJUSTMENT_TYPES: { value: OrderAdjustmentType; label: string }[] = [
  { value: 'discount', label: 'Discount' },
  { value: 'refund', label: 'Refund' },
  { value: 'shipping_change', label: 'Shipping change' },
  { value: 'manual_adjustment', label: 'Manual adjustment' },
  { value: 'status_change', label: 'Status change' },
];

const ORDER_STATUSES: OrderStatus[] = [
  'pending_payment',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [adjType, setAdjType] = useState<OrderAdjustmentType>('discount');
  const [amount, setAmount] = useState('');
  const [newStatus, setNewStatus] = useState<OrderStatus>('processing');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function load() {
    if (!id) return;
    getAdminOrder(id)
      .then(setOrder)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load order'));
  }

  useEffect(load, [id]);

  async function handleAdjust(e: FormEvent) {
    e.preventDefault();
    if (!order) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await adjustOrder(order.id, {
        type: adjType,
        amount: adjType !== 'status_change' ? Number(amount) : undefined,
        newStatus: adjType === 'status_change' ? newStatus : undefined,
        reason: reason || undefined,
      });
      setAmount('');
      setReason('');
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to apply adjustment');
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <ErrorMessage message={error} />;
  if (!order) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Order #{order.id}</h1>
        <Badge>{order.status.replace('_', ' ')}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">Shipping address</h2>
          <p className="text-sm text-muted-foreground">
            {order.shipping_address.recipient_name}
            <br />
            {order.shipping_address.line1}
            {order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ''}
            <br />
            {order.shipping_address.city}, {order.shipping_address.region} {order.shipping_address.postal_code}
            <br />
            {order.shipping_address.country}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">Line items</h2>
          <div className="flex flex-col gap-1 text-sm">
            {order.items.map((item) => (
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
          </div>
          <div className="mt-3 flex flex-col gap-1 border-t pt-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Adjustments</span>
              <span>{formatCurrency(order.adjustment_total)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-4 font-medium">Add adjustment</h2>
        <form onSubmit={handleAdjust} className="flex flex-col gap-4 max-w-md">
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={adjType} onValueChange={(v) => setAdjType(v as OrderAdjustmentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {adjType === 'status_change' ? (
            <div className="space-y-1">
              <Label>New status</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1">
              <Label>Amount (negative for discount/refund, positive for added fee)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1">
            <Label>Reason (optional)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          {formError && <ErrorMessage message={formError} />}

          <Button type="submit" disabled={submitting} className="w-fit">
            {submitting ? 'Applying...' : 'Apply adjustment'}
          </Button>
        </form>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-2 font-medium">Audit log</h2>
        {order.auditLog.length === 0 && <p className="text-sm text-muted-foreground">No changes recorded yet.</p>}
        <div className="flex flex-col gap-2">
          {order.auditLog.map((entry) => (
            <div key={entry.id} className="border-b pb-2 text-sm last:border-0">
              <p>
                <strong>{entry.field_changed}</strong>: {entry.old_value ?? '—'} &rarr; {entry.new_value}
              </p>
              {entry.reason && <p className="text-muted-foreground">Reason: {entry.reason}</p>}
              <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
