import { ShoppingCart } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getProductOptions, previewProductPrice } from '../../api/products';
import { formatCurrency } from '../../lib/utils';
import type { Product, ProductOptionGroup } from '../../types';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface ProductConfiguratorProps {
  product: Product;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  outOfStock: boolean;
  added: boolean;
  onAddToCart: (selections: { sizeInches?: number; selectedOptions: Record<string, string> }) => Promise<void>;
}

// Size/option selector + live server-computed price for a configurable
// product (product.pricing_config set — see server pricingFormulas). Price
// is always fetched from POST /products/:id/price-preview, never computed
// here — mirrors architecture.md §0's "totals derived server-side only" rule.
export function ProductConfigurator({
  product,
  quantity,
  onQuantityChange,
  outOfStock,
  added,
  onAddToCart,
}: ProductConfiguratorProps) {
  // Custom formulas carry minSizeInches; the per-unit shape derives its
  // minimum from the unit size. The server enforces both — this only keeps the
  // input's min in step with it.
  const params = product.pricing_config?.params;
  const minSize = params?.minSizeInches ?? params?.unitSizeInches ?? 1;
  const [groups, setGroups] = useState<ProductOptionGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [sizeInches, setSizeInches] = useState(minSize);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{ unitPrice: number; flatFeeDelta: number; totalWatts: number } | null>(
    null,
  );
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProductOptions(product.id)
      .then((res) => {
        if (cancelled) return;
        setGroups(res.groups);
        // Default every group to its first choice so a preview can run
        // immediately rather than showing "no selection" for required groups.
        const defaults: Record<string, string> = {};
        res.groups.forEach((g) => {
          if (g.choices[0]) defaults[g.key] = g.choices[0].key;
        });
        setSelectedOptions(defaults);
      })
      .finally(() => {
        if (!cancelled) setGroupsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const refreshPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const result = await previewProductPrice(product.id, { sizeInches, selectedOptions });
      setPreview(result);
    } catch (err) {
      setPreview(null);
      setPreviewError(err instanceof Error ? err.message : 'Unable to price this configuration');
    } finally {
      setPreviewLoading(false);
    }
  }, [product.id, sizeInches, selectedOptions]);

  useEffect(() => {
    if (groupsLoading) return;
    refreshPreview();
  }, [groupsLoading, refreshPreview]);

  const lineTotal = useMemo(() => {
    if (!preview) return null;
    return preview.unitPrice * quantity + preview.flatFeeDelta;
  }, [preview, quantity]);

  async function handleAdd() {
    setSubmitting(true);
    try {
      await onAddToCart({ sizeInches, selectedOptions });
    } finally {
      setSubmitting(false);
    }
  }

  if (groupsLoading) {
    return <p className="text-sm text-muted-foreground">Loading options...</p>;
  }

  const canAdd = !outOfStock && !previewLoading && !previewError && preview !== null;

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <Label htmlFor="size">Size (inches, {minSize}&quot; minimum)</Label>
        <input
          id="size"
          type="number"
          min={minSize}
          step={1}
          value={sizeInches}
          onChange={(e) => setSizeInches(Math.max(minSize, Number(e.target.value) || minSize))}
          className="h-11 w-32 rounded-md border border-input bg-background px-3 text-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        />
      </div>

      {groups.map((group) => (
        <div key={group.key} className="space-y-1">
          <Label>{group.label}</Label>
          <Select
            value={selectedOptions[group.key]}
            onValueChange={(value) => setSelectedOptions((prev) => ({ ...prev, [group.key]: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {group.choices.map((choice) => (
                <SelectItem key={choice.key} value={choice.key}>
                  {choice.label}
                  {choice.priceDelta ? ` (+${formatCurrency(choice.priceDelta)})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Label htmlFor="qty" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Quantity
        </Label>
        <input
          id="qty"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => onQuantityChange(Math.max(1, Number(e.target.value)))}
          className="h-11 w-20 rounded-md border border-input bg-background px-3 text-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          disabled={outOfStock}
        />
      </div>

      <div className="rounded-md border border-border/70 bg-muted/30 p-4">
        {previewError && <p className="text-sm text-destructive">{previewError}</p>}
        {!previewError && preview && (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Per unit</span>
              <span>{formatCurrency(preview.unitPrice)}</span>
            </div>
            {preview.flatFeeDelta > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Installation</span>
                <span>{formatCurrency(preview.flatFeeDelta)}</span>
              </div>
            )}
            <div className="flex justify-between font-display text-lg text-brand">
              <span>Total</span>
              <span>{lineTotal !== null ? formatCurrency(lineTotal) : '—'}</span>
            </div>
            <p className="pt-1 text-xs text-muted-foreground">Estimated load: {preview.totalWatts}W</p>
          </div>
        )}
        {!previewError && !preview && previewLoading && (
          <p className="text-sm text-muted-foreground">Calculating price...</p>
        )}
      </div>

      <Button onClick={handleAdd} disabled={!canAdd || submitting} size="lg">
        <ShoppingCart className="h-4 w-4" /> {added ? 'Added!' : 'Add to cart'}
      </Button>
    </div>
  );
}
