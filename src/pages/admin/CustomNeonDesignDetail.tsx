import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAdminCustomNeonDesign, updateAdminCustomNeonDesignNotes } from '../../api/admin';
import { NEON_SIZE_LABELS } from '../../api/customNeon';
import { ErrorMessage } from '../../components/layout/AsyncState';
import { DesignStatusBadge } from '../../components/product/DesignStatusBadge';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Skeleton } from '../../components/ui/skeleton';
import { Textarea } from '../../components/ui/textarea';
import { formatCurrency } from '../../lib/utils';
import type { CustomNeonDesign } from '../../types';

export function CustomNeonDesignDetail() {
  const { id } = useParams<{ id: string }>();
  const [design, setDesign] = useState<CustomNeonDesign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    if (!id) return;
    getAdminCustomNeonDesign(id)
      .then((d) => {
        setDesign(d);
        setNotes(d.adminNotes ?? '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load design'));
  }

  useEffect(load, [id]);

  async function handleSaveNotes() {
    if (!design) return;
    setSaving(true);
    try {
      const updated = await updateAdminCustomNeonDesignNotes(design.id, notes);
      setDesign(updated);
    } finally {
      setSaving(false);
    }
  }

  if (error) return <ErrorMessage message={error} />;
  if (!design) return <Skeleton className="h-64 w-full" />;

  const sourceImageUrl =
    design.inputPayload.sourceImageUrl || design.inputPayload.renderedImageUrl || null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Custom Neon Design #{design.id}</h1>
        <DesignStatusBadge status={design.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">Source input ({design.designType})</h2>
          {design.designType === 'text' ? (
            <p className="text-lg" style={{ fontFamily: design.inputPayload.fontFamily ?? undefined }}>
              {design.inputPayload.text}
            </p>
          ) : sourceImageUrl ? (
            <img src={sourceImageUrl} alt="Source design" className="max-h-80 w-full rounded-md border object-contain" />
          ) : design.imagesPurgedAt ? (
            <p className="text-sm text-muted-foreground">
              Image purged on {new Date(design.imagesPurgedAt).toLocaleDateString()} (never ordered).
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No source image available.</p>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">AI-generated preview</h2>
          {design.generatedImageUrl ? (
            <img
              src={design.generatedImageUrl}
              alt="AI-generated neon preview"
              className="max-h-80 w-full rounded-md border object-contain"
            />
          ) : design.imagesPurgedAt ? (
            <p className="text-sm text-muted-foreground">
              Image purged on {new Date(design.imagesPurgedAt).toLocaleDateString()} — this design was never
              confirmed into an order within the retention window.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {design.status === 'failed' ? 'Generation failed.' : 'Not generated yet.'}
            </p>
          )}
          {design.lastError && <p className="mt-2 text-sm text-destructive">Last error: {design.lastError}</p>}
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-2 font-medium">Order details</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Size</dt>
            <dd>{design.size ? NEON_SIZE_LABELS[design.size] : '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Color</dt>
            <dd className="capitalize">{design.neonColor ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Price</dt>
            <dd>{design.price !== null ? formatCurrency(design.price) : '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Linked product</dt>
            <dd>
              {design.productId ? (
                <Link className="underline" to={`/admin/products/${design.productId}`}>
                  #{design.productId}
                </Link>
              ) : (
                'Not confirmed yet'
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border p-4">
        <Label>Admin notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
        <Button type="button" className="w-fit" onClick={handleSaveNotes} disabled={saving}>
          {saving ? 'Saving…' : 'Save notes'}
        </Button>
      </div>
    </div>
  );
}
