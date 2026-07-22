import { RefreshCw, Star, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createProduct,
  deleteProductImage,
  getProductSeo,
  replaceProductGroups,
  setPrimaryImage,
  updateProduct,
  uploadProductImages,
} from '../../api/admin';
import { ApiError } from '../../api/client';
import { getCategories, getGroups, getProduct } from '../../api/products';
import { ErrorMessage } from '../../components/layout/AsyncState';
import { SeoStatusBadge } from '../../components/product/SeoStatusBadge';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import type { Category, Product, ProductGroup, ProductImage, ProductSeo } from '../../types';

interface FormState {
  name: string;
  description: string;
  price: string;
  sku: string;
  category_id: string;
  tags: string;
  is_featured: boolean;
  is_bestseller: boolean;
  is_clearance: boolean;
  stock_quantity: string;
  low_stock_threshold: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  price: '',
  sku: '',
  category_id: '',
  tags: '',
  is_featured: false,
  is_bestseller: false,
  is_clearance: false,
  stock_quantity: '0',
  low_stock_threshold: '',
};

export function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<number>>(new Set());
  const [images, setImages] = useState<ProductImage[]>([]);
  const [productId, setProductId] = useState<number | null>(isNew ? null : Number(id));
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [productSeo, setProductSeo] = useState<ProductSeo | null>(null);
  const [seoLoading, setSeoLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshSeo = useCallback(async (id: number) => {
    setSeoLoading(true);
    try {
      const seo = await getProductSeo(id);
      setProductSeo(seo);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setProductSeo(null);
      }
    } finally {
      setSeoLoading(false);
    }
  }, []);

  useEffect(() => {
    if (productId) refreshSeo(productId);
  }, [productId, refreshSeo]);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.items))
      .catch(() => setCategories([]));
    getGroups()
      .then((res) => setGroups(res.items))
      .catch(() => setGroups([]));
  }, []);

  useEffect(() => {
    if (isNew) return;
    getProduct(id!, { includeInactive: true })
      .then((product: Product) => {
        setForm({
          name: product.name,
          description: product.description ?? '',
          price: String(product.price),
          sku: product.sku,
          category_id: String(product.category_id),
          tags: (product.tags ?? []).join(', '),
          is_featured: product.is_featured,
          is_bestseller: product.is_bestseller,
          is_clearance: product.is_clearance,
          stock_quantity: String(product.stock_quantity ?? 0),
          low_stock_threshold: product.low_stock_threshold != null ? String(product.low_stock_threshold) : '',
        });
        setImages(product.images ?? []);
        setSelectedGroups(new Set(product.groupIds ?? []));
        setProductId(product.id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load product'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleGroup(groupId: number) {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        sku: form.sku,
        category_id: Number(form.category_id),
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        is_featured: form.is_featured,
        is_bestseller: form.is_bestseller,
        is_clearance: form.is_clearance,
        stock_quantity: Number(form.stock_quantity),
        low_stock_threshold: form.low_stock_threshold ? Number(form.low_stock_threshold) : null,
      };

      let savedId = productId;
      if (isNew) {
        const created = await createProduct(payload);
        savedId = created.id;
        setProductId(created.id);
      } else {
        await updateProduct(productId!, payload);
      }

      if (savedId) {
        await replaceProductGroups(savedId, Array.from(selectedGroups));
      }

      navigate('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || !productId) return;
    const res = await uploadProductImages(productId, Array.from(fileList));
    setImages((prev) => [...prev, ...res.images]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSetPrimary(imageId: number) {
    if (!productId) return;
    await setPrimaryImage(productId, imageId);
    setImages((prev) => prev.map((img) => ({ ...img, is_primary: img.id === imageId })));
  }

  async function handleDeleteImage(imageId: number) {
    if (!productId) return;
    await deleteProductImage(productId, imageId);
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">{isNew ? 'New product' : 'Edit product'}</h1>

      <div className="rounded-lg border bg-muted/40 p-4 text-sm">
        <p className="font-medium">Writing tips for better SEO / GEO results</p>
        <p className="mt-1 text-muted-foreground">
          Name, description, category, price, and tags are sent to our AI SEO/GEO generator. Specific,
          factual details produce better metadata and are less likely to get flagged for review. Vague or
          marketing-only copy (e.g. &quot;high quality product, you&apos;ll love it&quot;) often gets flagged.
        </p>
        <p className="mt-2 text-muted-foreground">
          Good description example: &quot;Hand-poured soy wax candle, 8oz, cotton wick, lavender &amp;
          cedarwood scent, burns 40+ hours. Made with natural, phthalate-free fragrance oil. Ideal for
          bedroom or bath use.&quot;
        </p>
        <p className="mt-1 text-muted-foreground">
          Try to include: material/ingredients, size or dimensions, key features, what makes it different
          from similar products, and the intended use case or audience.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Name">
          <Input required value={form.name} onChange={(e) => update('name', e.target.value)} />
        </FormField>

        <FormField label="Description">
          <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} />
          <p className="text-xs text-muted-foreground">
            Include material, size/dimensions, key features, and intended use. Specific details help the
            AI generate accurate SEO/GEO content and reduce the chance of it being flagged.
          </p>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Price">
            <Input
              type="number"
              step="0.01"
              min="0"
              required
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
            />
          </FormField>
          <FormField label="SKU">
            <Input required value={form.sku} onChange={(e) => update('sku', e.target.value)} />
          </FormField>
        </div>

        <FormField label="Category">
          <Select value={form.category_id} onValueChange={(v) => update('category_id', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Tags (comma-separated)">
          <Input value={form.tags} onChange={(e) => update('tags', e.target.value)} />
          <p className="text-xs text-muted-foreground">
            Use specific, searchable terms (e.g. &quot;soy wax, lavender, gift set&quot;) rather than generic
            words like &quot;good, best, new&quot;.
          </p>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Stock quantity">
            <Input
              type="number"
              min="0"
              required
              value={form.stock_quantity}
              onChange={(e) => update('stock_quantity', e.target.value)}
            />
          </FormField>
          <FormField label="Low stock threshold (optional)">
            <Input
              type="number"
              min="0"
              value={form.low_stock_threshold}
              onChange={(e) => update('low_stock_threshold', e.target.value)}
            />
          </FormField>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <p className="font-medium">Merchandising flags</p>
          <SwitchRow label="Featured" checked={form.is_featured} onChange={(v) => update('is_featured', v)} />
          <SwitchRow label="Bestseller" checked={form.is_bestseller} onChange={(v) => update('is_bestseller', v)} />
          <SwitchRow label="Clearance" checked={form.is_clearance} onChange={(v) => update('is_clearance', v)} />
        </div>

        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <p className="font-medium">Groups</p>
          {groups.length === 0 && <p className="text-sm text-muted-foreground">No groups defined yet.</p>}
          <div className="flex flex-wrap gap-3">
            {groups.map((group) => (
              <label key={group.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={selectedGroups.has(group.id)} onCheckedChange={() => toggleGroup(group.id)} />
                {group.name}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <p className="font-medium">Images</p>
          {!productId && (
            <p className="text-sm text-muted-foreground">Save the product first to upload images.</p>
          )}
          {productId && (
            <>
              <div className="flex flex-wrap gap-3">
                {images.map((img) => (
                  <div key={img.id} className="relative h-24 w-24 overflow-hidden rounded-md border">
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1">
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(img.id)}
                        aria-label="Set as primary"
                        className="text-white hover:text-amber-300"
                      >
                        <Star className={img.is_primary ? 'h-4 w-4 fill-amber-300 text-amber-300' : 'h-4 w-4'} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        aria-label="Delete image"
                        className="text-white hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" /> Upload images
              </Button>
            </>
          )}
        </div>

        {productId && (
          <SeoPanel seo={productSeo} loading={seoLoading} onRefresh={() => refreshSeo(productId)} />
        )}

        {error && <ErrorMessage message={error} />}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save product'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/admin/products')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// Read-only: content comes from the seo-geo-agent worker (see
// server/scripts/seo-geo-worker.js), not editable here. Saving the product
// re-queues generation whenever name/description/category/price/tags change.
function SeoPanel({
  seo,
  loading,
  onRefresh,
}: {
  seo: ProductSeo | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">SEO / GEO</p>
        <div className="flex items-center gap-2">
          {seo && <SeoStatusBadge status={seo.status} />}
          <Button type="button" variant="ghost" size="icon" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          </Button>
        </div>
      </div>

      {!seo && (
        <p className="text-sm text-muted-foreground">
          Not generated yet — this runs automatically in the background after saving.
        </p>
      )}

      {seo && (seo.status === 'pending' || seo.status === 'processing') && (
        <p className="text-sm text-muted-foreground">
          The SEO/GEO worker hasn&apos;t finished processing this product yet. Check back shortly.
        </p>
      )}

      {seo?.seo && (
        <dl className="grid grid-cols-1 gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Meta title</dt>
            <dd>{seo.seo.meta_title}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Meta description</dt>
            <dd>{seo.seo.meta_description}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">URL slug</dt>
            <dd>{seo.seo.url_slug}</dd>
          </div>
        </dl>
      )}

      {seo && seo.flags.length > 0 && (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-medium">Flagged for review</p>
          <ul className="list-disc pl-5">
            {seo.flags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {seo?.status === 'failed' && seo.lastError && (
        <p className="text-sm text-destructive">Last error: {seo.lastError}</p>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
