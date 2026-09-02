import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatCurrency, formatCurrencyOrTbd, PRICING_TBD_LABEL } from '../../lib/utils';
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
        <p className="text-sm text-muted-foreground">{formatCurrencyOrTbd(item.price)}{item.isQuote ? '' : ' each'}</p>
        {item.selectedOptions && (
          <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            {item.sizeInches != null && <p>Size: {item.sizeInches}&quot;</p>}
            {item.selectedOptions.choices
              .filter((c) => !c.isFlatFee)
              .map((c) => (
                <p key={c.groupKey}>
                  {c.groupLabel}: {c.choiceLabel}
                </p>
              ))}
            {item.selectedOptions.choices
              .filter((c) => c.isFlatFee && c.priceDelta)
              .map((c) => (
                <p key={c.groupKey}>
                  {c.choiceLabel} (+{formatCurrency(c.priceDelta)})
                </p>
              ))}
          </div>
        )}
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
      <p className="w-20 text-right font-medium">
        {item.price == null
              ? PRICING_TBD_LABEL
              : formatCurrency(item.price * item.quantity + (item.flatFeeTotal ?? 0))}
      </p>
      <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remove item">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
