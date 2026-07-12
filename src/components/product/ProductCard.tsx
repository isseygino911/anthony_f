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
    addItem(product.id, 1);
  }

  return (
    <Card className="group overflow-hidden">
      <Link to={`/product/${product.id}`}>
        <div className="relative aspect-square bg-muted">
          {primaryImage ? (
            <img src={primaryImage.url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">No image</div>
          )}
          <button
            onClick={handleFavoriteClick}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur hover:bg-background"
          >
            <Heart className={cn('h-4 w-4', isFavorited && 'fill-brand text-brand')} />
          </button>
          {product.is_clearance && (
            <span className="absolute left-2 top-2 rounded bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
              Clearance
            </span>
          )}
        </div>
        <CardContent className="space-y-1 p-4">
          <h3 className="line-clamp-1 font-medium">{product.name}</h3>
          <p className="font-semibold text-brand">{formatCurrency(product.price)}</p>
        </CardContent>
      </Link>
      <CardContent className="pt-0">
        <Button size="sm" className="w-full" onClick={handleAddToCart}>
          <ShoppingCart className="h-4 w-4" /> Add to cart
        </Button>
      </CardContent>
    </Card>
  );
}
