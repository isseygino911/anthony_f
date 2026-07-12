import { Heart, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProduct } from '../../api/products';
import { ErrorMessage } from '../../components/layout/AsyncState';
import { Gallery } from '../../components/product/Gallery';
import { StockBadge } from '../../components/product/StockBadge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useFavorites } from '../../hooks/useFavorites';
import { cn, formatCurrency } from '../../lib/utils';
import type { Product } from '../../types';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { favoriteIds, toggle } = useFavorites();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setProduct(null);
    setError(null);
    getProduct(id)
      .then((res) => {
        if (!cancelled) setProduct(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load product');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="container py-8">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container grid grid-cols-1 gap-8 py-8 md:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const isFavorited = favoriteIds.has(product.id);

  async function handleAddToCart() {
    await addItem(product!.id, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleFavoriteClick() {
    if (!user) {
      navigate('/login');
      return;
    }
    toggle(product!.id);
  }

  const outOfStock = product.stockStatus === 'out_of_stock';

  return (
    <div className="container grid grid-cols-1 gap-8 py-8 md:grid-cols-2">
      <Gallery images={product.images ?? []} alt={product.name} />

      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
        </div>

        {product.stockStatus && <StockBadge status={product.stockStatus} />}

        <p className="text-3xl font-bold text-brand">{formatCurrency(product.price)}</p>

        {product.description && <p className="text-muted-foreground">{product.description}</p>}

        <div className="flex items-center gap-3">
          <label htmlFor="qty" className="text-sm font-medium">
            Quantity
          </label>
          <input
            id="qty"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="h-10 w-20 rounded-md border border-input bg-background px-3 text-sm"
            disabled={outOfStock}
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={handleAddToCart} disabled={outOfStock} className="flex-1">
            <ShoppingCart className="h-4 w-4" /> {added ? 'Added!' : 'Add to cart'}
          </Button>
          <Button variant="outline" size="icon" onClick={handleFavoriteClick} aria-label="Toggle favorite">
            <Heart className={cn('h-5 w-5', isFavorited && 'fill-brand text-brand')} />
          </Button>
        </div>
      </div>
    </div>
  );
}
