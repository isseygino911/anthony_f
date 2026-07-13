import { Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../lib/utils';
import type { CartItem } from '../../types';
import { buttonVariants } from '../ui/button';
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '../ui/sheet';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { cart, updateItem, removeItem } = useCart();
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle>Your cart{itemCount > 0 && ` (${itemCount})`}</SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <SheetClose asChild>
              <Link
                to="/products"
                className="text-xs font-semibold uppercase tracking-[0.12em] text-brand underline-offset-4 hover:underline"
              >
                Continue shopping
              </Link>
            </SheetClose>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {cart.items.map((item) => (
                <DrawerLineItem
                  key={item.productId}
                  item={item}
                  onUpdateQuantity={(qty) => updateItem(item.productId, qty)}
                  onRemove={() => removeItem(item.productId)}
                />
              ))}
            </div>
            <SheetFooter className="border-t border-border px-6 py-5">
              <div className="flex justify-between pb-1 font-display text-lg">
                <span>Subtotal</span>
                <span>{formatCurrency(cart.subtotal)}</span>
              </div>
              <p className="pb-2 text-xs text-muted-foreground">Shipping and taxes calculated at checkout.</p>
              <SheetClose asChild>
                <Link to="/checkout" className={buttonVariants({ size: 'lg', className: 'w-full' })}>
                  Checkout
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link to="/cart" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'w-full' })}>
                  View cart
                </Link>
              </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface DrawerLineItemProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

function DrawerLineItem({ item, onUpdateQuantity, onRemove }: DrawerLineItemProps) {
  return (
    <div className="flex gap-4 border-b border-border/70 py-4 last:border-0">
      <div className="h-20 w-20 shrink-0 overflow-hidden bg-muted">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-xs font-medium uppercase leading-snug tracking-wide">{item.name}</p>
          <button
            onClick={onRemove}
            aria-label="Remove item"
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              aria-label="Decrease quantity"
              className="flex h-6 w-6 items-center justify-center border border-border text-foreground transition-colors hover:bg-muted"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-4 text-center text-xs">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              aria-label="Increase quantity"
              className="flex h-6 w-6 items-center justify-center border border-border text-foreground transition-colors hover:bg-muted"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <p className="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</p>
        </div>
      </div>
    </div>
  );
}
