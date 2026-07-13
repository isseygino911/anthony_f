import { Link, useNavigate } from 'react-router-dom';
import { CartLineItem } from '../../components/cart/CartLineItem';
import { EmptyState, ErrorMessage } from '../../components/layout/AsyncState';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../lib/utils';

export function CartPage() {
  const { cart, loading, error, updateItem, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  function handleCheckout() {
    if (user) navigate('/checkout');
    else navigate('/login', { state: { from: '/checkout' } });
  }

  return (
    <div className="container flex flex-col gap-8 py-12">
      <h1 className="font-display text-3xl tracking-tight">Your Cart</h1>

      {error && <ErrorMessage message={error} />}

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {!loading && cart.items.length === 0 && !error && (
        <EmptyState message="Your cart is empty. Start browsing to add products." />
      )}

      {!loading && cart.items.length > 0 && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {cart.items.map((item) => (
              <CartLineItem
                key={item.productId}
                item={item}
                onUpdateQuantity={(qty) => updateItem(item.productId, qty)}
                onRemove={() => removeItem(item.productId)}
              />
            ))}
          </div>

          <div className="flex flex-col gap-4 rounded-md border border-border/70 bg-card p-6 lg:sticky lg:top-24 lg:h-fit">
            <div className="flex justify-between font-display text-lg">
              <span>Subtotal</span>
              <span>{formatCurrency(cart.subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Shipping and taxes calculated at checkout.</p>
            <Button onClick={handleCheckout} size="lg">
              Proceed to checkout
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/products">Continue shopping</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
