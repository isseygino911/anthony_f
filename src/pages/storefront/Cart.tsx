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
    <div className="container flex flex-col gap-6 py-8">
      <h1 className="text-2xl font-semibold">Your Cart</h1>

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

          <div className="flex flex-col gap-4 rounded-lg border p-6">
            <div className="flex justify-between font-medium">
              <span>Subtotal</span>
              <span>{formatCurrency(cart.subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Shipping and taxes calculated at checkout.</p>
            <Button onClick={handleCheckout}>Proceed to checkout</Button>
            <Button variant="ghost" asChild>
              <Link to="/products">Continue shopping</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
