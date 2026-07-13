import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import type { CartItem } from '../../types';
import { Button } from '../ui/button';

interface CartLineItemProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function CartLineItem({ item, onUpdateQuantity, onRemove }: CartLineItemProps) {
  return (
    <div className="flex items-center gap-5 border-b border-border/70 py-5 last:border-0">
      <div className="h-24 w-24 shrink-0 overflow-hidden bg-muted">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium uppercase tracking-wide">{item.name}</p>
        <p className="text-sm text-muted-foreground">{formatCurrency(item.price)} each</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onUpdateQuantity(item.quantity - 1)}
          aria-label="Decrease quantity"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-6 text-center">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onUpdateQuantity(item.quantity + 1)}
          aria-label="Increase quantity"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <p className="w-20 text-right font-medium">{formatCurrency(item.price * item.quantity)}</p>
      <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remove item">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
