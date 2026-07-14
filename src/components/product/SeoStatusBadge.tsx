import { Badge } from '../ui/badge';
import type { ProductSeoStatus } from '../../types';

const LABELS: Record<ProductSeoStatus, string> = {
  pending: 'SEO: queued',
  processing: 'SEO: generating',
  ready: 'SEO: ready',
  needs_review: 'SEO: needs review',
  failed: 'SEO: failed',
};

const VARIANTS: Record<ProductSeoStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  pending: 'secondary',
  processing: 'secondary',
  ready: 'success',
  needs_review: 'warning',
  failed: 'destructive',
};

export function SeoStatusBadge({ status }: { status: ProductSeoStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
