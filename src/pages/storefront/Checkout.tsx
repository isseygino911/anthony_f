import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../../api/orders';
import { ErrorMessage } from '../../components/layout/AsyncState';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../lib/utils';
import type { ShippingAddress } from '../../types';

const EMPTY_ADDRESS: ShippingAddress = {
  recipient_name: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  postal_code: '',
  country: '',
};

export function Checkout() {
  const { cart, refresh } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ShippingAddress>(key: K, value: ShippingAddress[K]) {
    setAddress((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder(address);
      await refresh();
      navigate(`/order-confirmation/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="container py-8">
        <ErrorMessage message="Your cart is empty — add items before checking out." />
      </div>
    );
  }

  return (
    <div className="container grid grid-cols-1 gap-12 py-12 lg:grid-cols-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 lg:col-span-2">
        <h1 className="font-display text-3xl tracking-tight">Shipping information</h1>

        <Field label="Recipient name">
          <Input required value={address.recipient_name} onChange={(e) => update('recipient_name', e.target.value)} />
        </Field>
        <Field label="Address line 1">
          <Input required value={address.line1} onChange={(e) => update('line1', e.target.value)} />
        </Field>
        <Field label="Address line 2 (optional)">
          <Input value={address.line2} onChange={(e) => update('line2', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="City">
            <Input required value={address.city} onChange={(e) => update('city', e.target.value)} />
          </Field>
          <Field label="Region / State">
            <Input required value={address.region} onChange={(e) => update('region', e.target.value)} />
          </Field>
          <Field label="Postal code">
            <Input required value={address.postal_code} onChange={(e) => update('postal_code', e.target.value)} />
          </Field>
          <Field label="Country">
            <Input required value={address.country} onChange={(e) => update('country', e.target.value)} />
          </Field>
        </div>

        <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Payment (coming soon)</p>
          <p>Stripe checkout is not yet wired up. Placing an order records it as pending payment.</p>
        </div>

        {error && <ErrorMessage message={error} />}

        <Button type="submit" disabled={submitting} size="lg">
          {submitting ? 'Placing order...' : 'Place order'}
        </Button>
      </form>

      <div className="flex h-fit flex-col gap-3 rounded-md border border-border/70 bg-card p-6">
        <h2 className="font-display text-lg tracking-tight">Order summary</h2>
        {cart.items.map((item) => (
          <div key={item.productId} className="flex justify-between text-sm">
            <span>
              {item.name} &times; {item.quantity}
            </span>
            <span>{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border/70 pt-3 font-medium">
          <span>Subtotal</span>
          <span>{formatCurrency(cart.subtotal)}</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
