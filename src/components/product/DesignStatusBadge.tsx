import { Badge } from '../ui/badge';
import type { CustomNeonDesignStatus } from '../../types';

const LABELS: Record<CustomNeonDesignStatus, string> = {
  pending: 'Queued',
  processing: 'Generating preview',
  ready: 'Preview ready',
  needs_review: 'Needs review',
  failed: 'Failed',
};

const VARIANTS: Record<CustomNeonDesignStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  pending: 'secondary',
  processing: 'secondary',
  ready: 'success',
  needs_review: 'warning',
  failed: 'destructive',
};

export function DesignStatusBadge({ status }: { status: CustomNeonDesignStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
