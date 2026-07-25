import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { ErrorMessage } from '../../components/layout/AsyncState';
import { Button } from '../../components/ui/button';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

interface PaymentStepProps {
  orderId: number;
  clientSecret: string;
  onPaid: () => void;
}

export function PaymentStep({ orderId, clientSecret, onPaid }: PaymentStepProps) {
  if (!stripePromise) {
    return (
      <ErrorMessage message="Stripe isn't configured yet — set VITE_STRIPE_PUBLISHABLE_KEY to enable payment." />
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm orderId={orderId} onPaid={onPaid} />
    </Elements>
  );
}

function PaymentForm({ orderId, onPaid }: { orderId: number; onPaid: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    if (!stripe || !elements) return;
    setConfirming(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation/${orderId}`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed. Please try again.');
      setConfirming(false);
      return;
    }

    onPaid();
  }

  return (
    <div className="flex flex-col gap-5">
      <PaymentElement />
      {error && <ErrorMessage message={error} />}
      <Button type="button" onClick={handlePay} disabled={!stripe || !elements || confirming} size="lg">
        {confirming ? 'Confirming payment...' : 'Pay now'}
      </Button>
    </div>
  );
}
