import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder, createPaymentIntent } from '../../api/orders';
import { ErrorMessage } from '../../components/layout/AsyncState';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Skeleton } from '../../components/ui/skeleton';
import { useCart } from '../../hooks/useCart';
import { formatCurrency, PRICING_TBD_LABEL } from '../../lib/utils';
import type { Order, ShippingAddress } from '../../types';
import { PaymentStep } from './PaymentStep';

// Contact details required alongside the address when the cart holds a
// custom-size item — the server validates the same four fields
// (contact.service.js#assertQuoteContact) and rejects the order without them.
interface QuoteContact {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const EMPTY_CONTACT: QuoteContact = { name: '', email: '', phone: '', message: '' };

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
  const { cart, loading: cartLoading, refresh } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<{ orderId: number; clientSecret: string } | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [contact, setContact] = useState<QuoteContact>(EMPTY_CONTACT);
  // Set once a quote order is placed: there is no payment step to move on to,
  // so the page shows a confirmation instead.
  const [quotePlaced, setQuotePlaced] = useState<Order | null>(null);

  // The cart decides the whole shape of this page: a quote cart collects
  // contact details and ends at "we'll be in touch", a normal one goes
  // straight to Stripe.
  const isQuote = cart.hasQuoteItems;

  function updateContact<K extends keyof QuoteContact>(key: K, value: QuoteContact[K]) {
    setContact((prev) => ({ ...prev, [key]: value }));
  }

  function update<K extends keyof ShippingAddress>(key: K, value: ShippingAddress[K]) {
    setAddress((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder(address, isQuote ? contact : undefined);
      await refresh();
      // A quote order has no total to charge — asking Stripe for an intent
      // here would 400 (payment.service.js refuses pending_quote). The
      // customer is done; the admin prices it and notifies them.
      if (isQuote) {
        setPlacedOrder(order);
        setQuotePlaced(order);
        return;
      }
      const { clientSecret } = await createPaymentIntent(order.id);
      setPlacedOrder(order);
      setPayment({ orderId: order.id, clientSecret });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  }

  if (cartLoading && !payment) {
    return (
      <div className="container py-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (cart.items.length === 0 && !payment) {
    return (
      <div className="container py-8">
        <ErrorMessage
          message={
            error ?? 'Your cart is empty — add items before checking out.'
          }
        />
      </div>
    );
  }

  return (
    <div className="container grid grid-cols-1 gap-12 py-12 lg:grid-cols-3">
      <div className="flex flex-col gap-5 lg:col-span-2">
        {quotePlaced ? (
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-3xl tracking-tight">Quote requested</h1>
            <p className="text-sm text-muted-foreground">
              Thanks — we have your order (#{quotePlaced.id}) and your custom dimensions. Our team
              will price it by hand and email you a quote. <strong>Nothing has been charged yet</strong>,
              and you will be able to pay once the quote is ready.
            </p>
            <p className="text-sm text-muted-foreground">
              You will also find the update in your notifications and on the order itself.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/account/orders')} size="lg">
                View my orders
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/')}>
                Continue browsing
              </Button>
            </div>
          </div>
        ) : payment ? (
          <>
            <h1 className="font-display text-3xl tracking-tight">Payment</h1>
            <PaymentStep
              orderId={payment.orderId}
              clientSecret={payment.clientSecret}
              onPaid={() => navigate(`/order-confirmation/${payment.orderId}`)}
            />
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

            {isQuote && (
              <>
                <div className="rounded-md border border-border/70 bg-muted/40 p-4">
                  <h2 className="font-display text-lg tracking-tight">Your custom size needs a quote</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    One or more items use dimensions you specified, so we price them by hand. Leave
                    your details and we will email you a quote — you will not be charged today.
                  </p>
                </div>

                <h2 className="font-display text-2xl tracking-tight">Contact details</h2>
                <Field label="Full name">
                  <Input required value={contact.name} onChange={(e) => updateContact('name', e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Email">
                    <Input
                      required
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateContact('email', e.target.value)}
                    />
                  </Field>
                  <Field label="Phone">
                    <Input
                      required
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => updateContact('phone', e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Anything else we should know? (optional)">
                  <textarea
                    rows={4}
                    value={contact.message}
                    onChange={(e) => updateContact('message', e.target.value)}
                    placeholder="A deadline, where it will hang, or how you plan to mount it."
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </Field>
              </>
            )}

            {error && <ErrorMessage message={error} />}

            <Button type="submit" disabled={submitting} size="lg">
              {submitting
                ? isQuote
                  ? 'Sending request...'
                  : 'Placing order...'
                : isQuote
                  ? 'Request my quote'
                  : 'Continue to payment'}
            </Button>
          </form>
        )}
      </div>

      <div className="flex h-fit flex-col gap-3 rounded-md border border-border/70 bg-card p-6">
        <h2 className="font-display text-lg tracking-tight">Order summary</h2>
        {placedOrder ? (
          <>
            {placedOrder.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.label}
                  {item.quantity ? ` × ${item.quantity}` : ''}
                </span>
                <span>
                  {item.unit_price == null && item.amount == null
                    ? PRICING_TBD_LABEL
                    : formatCurrency(
                        item.unit_price ? item.unit_price * (item.quantity ?? 1) : (item.amount ?? 0)
                      )}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border/70 pt-3 font-medium">
              <span>Total</span>
              <span>
                {placedOrder.status === 'pending_quote'
                  ? PRICING_TBD_LABEL
                  : formatCurrency(placedOrder.adjustedTotal ?? placedOrder.total)}
              </span>
            </div>
          </>
        ) : (
          <>
            {cart.items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span>
                  {item.name} &times; {item.quantity}
                </span>
                <span>
                  {item.price == null ? PRICING_TBD_LABEL : formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border/70 pt-3 font-medium">
              <span>Subtotal</span>
              <span>{formatCurrency(cart.subtotal)}</span>
            </div>
            {isQuote && (
              <p className="text-xs text-muted-foreground">
                Excludes custom-size items, which we price by hand and quote separately.
              </p>
            )}
          </>
        )}
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
