import { Star, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createProduct,
  deleteProductImage,
  replaceProductGroups,
  setPrimaryImage,
  updateProduct,
  uploadProductImages,
} from '../../api/admin';
import { getCategories, getGroups, getProduct } from '../../api/products';
import { ErrorMessage } from '../../components/layout/AsyncState';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import type { Category, Product, ProductGroup, ProductImage } from '../../types';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    getProduct(id!)
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Name">
          <Input required value={form.name} onChange={(e) => update('name', e.target.value)} />
        </FormField>

        <FormField label="Description">
          <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} />
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
