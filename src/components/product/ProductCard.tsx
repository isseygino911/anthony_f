import { Heart, ShoppingCart } from 'lucide-react';
import type { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useFavorites } from '../../hooks/useFavorites';
import { cn, formatCurrency } from '../../lib/utils';
import type { Product } from '../../types';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

export function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { favoriteIds, toggle } = useFavorites();
  const navigate = useNavigate();

  const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0];
  const isFavorited = favoriteIds.has(product.id);
  const outOfStock = product.stockStatus === 'out_of_stock';

  function handleFavoriteClick(e: MouseEvent) {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    toggle(product.id);
  }

  function handleAddToCart(e: MouseEvent) {
    e.preventDefault();
    if (outOfStock) return;
    addItem(product.id, 1);
  }

  return (
    <Card className="group overflow-hidden rounded-none border-none bg-transparent shadow-none">
      <Link to={`/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">No image</div>
          )}
          <button
            onClick={handleFavoriteClick}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur hover:bg-background"
          >
            <Heart className={cn('h-4 w-4', isFavorited && 'fill-brand text-brand')} />
          </button>
          {product.is_clearance && (
            <span className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive-foreground">
              Clearance
            </span>
          )}
        </div>
        <CardContent className="space-y-1 px-0 pb-0 pt-4 text-center">
          <h3 className="line-clamp-1 text-xs font-medium uppercase tracking-[0.08em]">{product.name}</h3>
          <p className="font-display text-base text-brand">{formatCurrency(product.price)}</p>
        </CardContent>
      </Link>
      <CardContent className="px-0 pb-0 pt-3">
        <Button size="sm" variant="outline" className="w-full" onClick={handleAddToCart} disabled={outOfStock}>
          <ShoppingCart className="h-4 w-4" /> {outOfStock ? 'Out of stock' : 'Add to cart'}
        </Button>
      </CardContent>
    </Card>
  );
}
