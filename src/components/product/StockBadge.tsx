import { Badge } from '../ui/badge';
import type { StockStatus } from '../../types';

const LABELS: Record<StockStatus, string> = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
};

const VARIANTS: Record<StockStatus, 'success' | 'warning' | 'destructive'> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'destructive',
};

/** Customer-facing wording only — never exact stock_quantity (architecture.md §4.2). */
export function StockBadge({ status }: { status: StockStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
