import { RefreshCw, Star, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createProduct,
  createProductFromDesign,
  deleteProductImage,
  getAdminCustomNeonDesign,
  getProductSeo,
  replaceProductGroups,
  setPrimaryImage,
  setProductOptions,
  updateProduct,
  uploadProductImages,
} from '../../api/admin';
import type { ProductOptionGroupInput } from '../../api/admin';
import { ApiError } from '../../api/client';
import { NEON_SIZE_PRICES, describeNeonColorForDescription } from '../../api/customNeon';
import { getCategories, getGroups, getProduct, getProductOptions, previewProductPrice } from '../../api/products';
import { ErrorMessage } from '../../components/layout/AsyncState';
import { FormulaBuilder } from '../../components/admin/FormulaBuilder';
import { ProductOptionsEditor } from '../../components/admin/ProductOptionsEditor';
import { SeoStatusBadge } from '../../components/product/SeoStatusBadge';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import type { Category, PricingConfig, Product, ProductGroup, ProductImage, ProductSeo } from '../../types';

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

  // Set when arriving from the Custom Neon Designs page's "Create product"
  // button. The design's image already lives in S3, and the image endpoint
  // below only accepts uploaded File objects — so publishing goes through a
  // dedicated server route that attaches the image itself.
  const [searchParams] = useSearchParams();
  const designIdParam = searchParams.get('designId');
  const designId = isNew && designIdParam ? Number(designIdParam) : null;
  const [designPreviewUrl, setDesignPreviewUrl] = useState<string | null>(null);

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

  // Configurable pricing (server/src/services/pricingFormulas). isConfigurable
  // toggles whether pricingConfig/optionGroups are sent at all — a product
  // that never opts in stays a plain flat-price product, unchanged.
  const [isConfigurable, setIsConfigurable] = useState(false);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>({
    formulaType: 'linear_per_unit',
    params: { basePrice: 35, unitSizeInches: 12, pricePerExtraUnit: 25, wattsPerUnit: 4 },
  });
  const [optionGroups, setOptionGroups] = useState<ProductOptionGroupInput[]>([]);

  // Switching type keeps whatever params the other shapes need, so toggling
  // back and forth doesn't silently lose the admin's numbers.
  function setFormulaType(formulaType: PricingConfig['formulaType']) {
    setPricingConfig((prev) => ({
      ...prev,
      formulaType,
      formula: formulaType === 'custom' ? (prev.formula ?? { price: '' }) : prev.formula,
    }));
  }

  // Prefills the canvas with the expression equivalent of the current
  // per-unit params. Backend tests assert these two expressions reproduce
  // linear_per_unit exactly, so converting a live product does not change
  // what customers are charged.
  function convertToCustomFormula() {
    const { basePrice = 0, unitSizeInches = 12, pricePerExtraUnit = 0, wattsPerUnit = 0 } = pricingConfig.params;
    setPricingConfig({
      formulaType: 'custom',
      params: {
        ...pricingConfig.params,
        minSizeInches: unitSizeInches,
        constants: {
          ...(pricingConfig.params.constants ?? {}),
          basePrice,
          unitSize: unitSizeInches,
          perExtra: pricePerExtraUnit,
          wattsPerUnit,
        },
      },
      formula: {
        price: 'basePrice + max(0, ceil(sizeInches / unitSize) - 1) * perExtra',
        watts: 'ceil(sizeInches / unitSize) * wattsPerUnit',
      },
    });
  }

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

  // Prefill from the design so a straightforward publish needs no typing.
  // Everything stays editable — this becomes a real catalog listing, not the
  // hidden per-order product the customer confirm flow creates.
  useEffect(() => {
    if (!designId) return;
    getAdminCustomNeonDesign(designId)
      .then((design) => {
        // Server-derived, so it covers customer-typed dimensions as well as
        // the presets and matches describeDimensions() exactly — the
        // description below has to be byte-identical to the server's.
        const dimensions = design.dimensions;
        setDesignPreviewUrl(design.generatedImageUrl);
        setForm((prev) => ({
          ...prev,
          name: `Custom Neon Design #${design.id}`,
          // Mirrors the description confirmDesign() writes server-side (see
          // describeColorForCustomer in customNeonDesign.service.js) — the two
          // must produce identical text for the same design.
          description: dimensions
            ? `Custom AI-generated neon sign design (${dimensions}, ${describeNeonColorForDescription(design.neonColor)}).`
            : prev.description,
          // A custom-size design has no preset price and may not have been
          // quoted yet — left blank for the admin to fill in rather than
          // prefilled with a preset price that does not apply to it.
          price: String(
            design.price ??
              (design.size && design.size !== 'custom' ? NEON_SIZE_PRICES[design.size] : '')
          ),
          sku: `NEON-PUB-${design.id}`,
        }));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load design'));
  }, [designId]);

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
        if (product.pricing_config) {
          setIsConfigurable(true);
          setPricingConfig(product.pricing_config);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load product'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  useEffect(() => {
    if (isNew || !productId) return;
    getProductOptions(productId)
      .then((res) => {
        setOptionGroups(
          res.groups.map((g) => ({
            key: g.key,
            label: g.label,
            type: g.type,
            sortOrder: g.sortOrder,
            choices: g.choices.map((c) => ({
              key: c.key,
              label: c.label,
              priceDelta: c.priceDelta,
              extra: c.extra,
              sortOrder: c.sortOrder,
            })),
          })),
        );
      })
      .catch(() => setOptionGroups([]));
  }, [productId, isNew]);

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
        pricing_config: isConfigurable ? pricingConfig : null,
      };

      let savedId = productId;
      if (designId) {
        // Server-side create: it copies the design's S3 image onto the new
        // product, which the normal create + upload-images pair can't do.
        const created = await createProductFromDesign(designId, {
          name: payload.name,
          description: payload.description ?? null,
          price: payload.price,
          category_id: payload.category_id,
        });
        savedId = created.id;
        setProductId(created.id);
        await replaceProductGroups(savedId, Array.from(selectedGroups));
        await setProductOptions(savedId, isConfigurable ? optionGroups : []);
        if (isConfigurable) await updateProduct(savedId, payload);
      } else if (isNew) {
        const created = await createProduct(payload);
        savedId = created.id;
        setProductId(created.id);
        await replaceProductGroups(savedId, Array.from(selectedGroups));
        await setProductOptions(savedId, isConfigurable ? optionGroups : []);
      } else {
        // Options go first: a custom formula may reference option groups by
        // key, and the server validates those names against the groups the
        // product actually has persisted.
        await replaceProductGroups(productId!, Array.from(selectedGroups));
        await setProductOptions(productId!, isConfigurable ? optionGroups : []);
        await updateProduct(productId!, payload);
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
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">
        {designId ? 'Publish design as product' : isNew ? 'New product' : 'Edit product'}
      </h1>

      {designId && (
        <div className="flex items-center gap-4 rounded-lg border p-4">
          {designPreviewUrl ? (
            <img
              src={designPreviewUrl}
              alt="Custom neon design preview"
              className="h-24 w-24 rounded-md border object-contain"
            />
          ) : (
            <div className="h-24 w-24 rounded-md border bg-muted" />
          )}
          <div className="text-sm">
            <p className="font-medium">Custom neon design #{designId}</p>
            <p className="text-muted-foreground">
              This image is attached to the product automatically when you save. The design keeps its own
              copy, so the two are independent from here on.
            </p>
          </div>
        </div>
      )}

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

        <div className="flex flex-col gap-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Configurable pricing</p>
              <p className="text-xs text-muted-foreground">
                Price by size/length instead of a fixed price. When enabled, &quot;Price&quot; above is ignored and
                the price shown to customers is computed from the formula below plus any option add-ons.
              </p>
            </div>
            <Switch checked={isConfigurable} onCheckedChange={setIsConfigurable} />
          </div>

          {isConfigurable && (
            <>
              <FormField label="Pricing formula">
                <Select
                  value={pricingConfig.formulaType}
                  onValueChange={(v) => setFormulaType(v as PricingConfig['formulaType'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear_per_unit">Per-unit (simple)</SelectItem>
                    <SelectItem value="flat">Flat price</SelectItem>
                    <SelectItem value="custom">Custom formula</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {pricingConfig.formulaType === 'flat' && (
                <FormField label="Base price">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricingConfig.params.basePrice ?? ''}
                    onChange={(e) =>
                      setPricingConfig((prev) => ({
                        ...prev,
                        params: { ...prev.params, basePrice: Number(e.target.value) },
                      }))
                    }
                  />
                </FormField>
              )}

              {pricingConfig.formulaType === 'custom' && (
                <>
                  <div className="flex flex-wrap items-end gap-3">
                    <FormField label="Minimum size (inches)">
                      <Input
                        className="w-32"
                        type="number"
                        min="0"
                        step="any"
                        value={pricingConfig.params.minSizeInches ?? ''}
                        onChange={(e) =>
                          setPricingConfig((prev) => ({
                            ...prev,
                            params: {
                              ...prev.params,
                              minSizeInches: e.target.value ? Number(e.target.value) : undefined,
                            },
                          }))
                        }
                      />
                    </FormField>
                    <p className="pb-2 text-xs text-muted-foreground">
                      Leave blank if this product has no size input.
                    </p>
                  </div>

                  <FormulaBuilder
                    label="Price formula"
                    description="Produces the base price. Option add-ons the customer selects are added on top automatically."
                    value={pricingConfig.formula?.price ?? ''}
                    onChange={(price) =>
                      setPricingConfig((prev) => ({
                        ...prev,
                        formula: { ...prev.formula, price },
                      }))
                    }
                    optionGroups={optionGroups}
                    constants={pricingConfig.params.constants ?? {}}
                    onConstantsChange={(constants) =>
                      setPricingConfig((prev) => ({ ...prev, params: { ...prev.params, constants } }))
                    }
                  />

                  <FormulaBuilder
                    label="Wattage formula (optional)"
                    description="Estimated electrical load. Used to stop a customer picking a power supply that cannot carry it. Leave empty to disable that check."
                    value={pricingConfig.formula?.watts ?? ''}
                    onChange={(watts) =>
                      setPricingConfig((prev) => ({
                        ...prev,
                        formula: { price: prev.formula?.price ?? '', watts: watts || undefined },
                      }))
                    }
                    optionGroups={optionGroups}
                    constants={pricingConfig.params.constants ?? {}}
                    onConstantsChange={(constants) =>
                      setPricingConfig((prev) => ({ ...prev, params: { ...prev.params, constants } }))
                    }
                  />

                  <FormulaPreview
                    productId={productId}
                    pricingConfig={pricingConfig}
                    optionGroups={optionGroups}
                  />
                </>
              )}

              {pricingConfig.formulaType === 'linear_per_unit' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Base price (covers first unit)">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricingConfig.params.basePrice}
                    onChange={(e) =>
                      setPricingConfig((prev) => ({
                        ...prev,
                        params: { ...prev.params, basePrice: Number(e.target.value) },
                      }))
                    }
                  />
                </FormField>
                <FormField label="Unit size (inches)">
                  <Input
                    type="number"
                    min="1"
                    value={pricingConfig.params.unitSizeInches ?? ''}
                    onChange={(e) =>
                      setPricingConfig((prev) => ({
                        ...prev,
                        params: { ...prev.params, unitSizeInches: Number(e.target.value) },
                      }))
                    }
                  />
                </FormField>
                <FormField label="Price per extra unit">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricingConfig.params.pricePerExtraUnit ?? ''}
                    onChange={(e) =>
                      setPricingConfig((prev) => ({
                        ...prev,
                        params: { ...prev.params, pricePerExtraUnit: Number(e.target.value) },
                      }))
                    }
                  />
                </FormField>
                <FormField label="Watts per unit">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={pricingConfig.params.wattsPerUnit ?? ''}
                    onChange={(e) =>
                      setPricingConfig((prev) => ({
                        ...prev,
                        params: { ...prev.params, wattsPerUnit: Number(e.target.value) },
                      }))
                    }
                  />
                </FormField>
              </div>
              )}

              {pricingConfig.formulaType === 'linear_per_unit' && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Example: base $35, unit 12&quot;, +$25/extra unit, 4W/unit means a 24&quot; item costs $60 and
                    draws an estimated 8W.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={convertToCustomFormula}>
                    Convert to custom formula
                  </Button>
                </div>
              )}

              <ProductOptionsEditor groups={optionGroups} onChange={setOptionGroups} />
            </>
          )}
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
            <p className="text-sm text-muted-foreground">
              {designId
                ? 'The design preview is attached on save. You can add more images afterwards.'
                : 'Save the product first to upload images.'}
            </p>
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

// Prices a draft formula through the same endpoint (and therefore the same
// server-side math) that charges customers, rather than approximating it here.
// Needs a saved product because the server resolves the product's option
// groups from the database to build the formula's variables.
function FormulaPreview({
  productId,
  pricingConfig,
  optionGroups,
}: {
  productId: number | null;
  pricingConfig: PricingConfig;
  optionGroups: ProductOptionGroupInput[];
}) {
  const [sizeInches, setSizeInches] = useState('24');
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ unitPrice: number; flatFeeDelta: number; totalWatts: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const priceFormula = pricingConfig.formula?.price ?? '';
  const wattsFormula = pricingConfig.formula?.watts ?? '';
  const selectedKey = JSON.stringify(selected);

  useEffect(() => {
    if (!productId || priceFormula.trim() === '') {
      setResult(null);
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        const preview = await previewProductPrice(productId, {
          sizeInches: sizeInches ? Number(sizeInches) : undefined,
          selectedOptions: selected,
          pricingConfigOverride: pricingConfig,
        });
        setResult(preview);
        setError(null);
      } catch (err) {
        setResult(null);
        setError(err instanceof Error ? err.message : 'Preview failed');
      }
    }, 300);
    return () => clearTimeout(timer);
    // pricingConfig is a fresh object each render, so depend on its meaningful parts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, priceFormula, wattsFormula, sizeInches, selectedKey]);

  if (!productId) {
    return (
      <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
        Save the product to preview pricing.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border bg-muted/20 p-3">
      <p className="text-sm font-medium">Preview</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Size (inches)</Label>
          <Input
            className="w-24"
            type="number"
            step="any"
            value={sizeInches}
            onChange={(e) => setSizeInches(e.target.value)}
          />
        </div>
        {optionGroups
          .filter((group) => group.key && group.choices.length > 0)
          .map((group) => (
            <div key={group.key} className="space-y-1">
              <Label className="text-xs">{group.label || group.key}</Label>
              <Select
                value={selected[group.key] ?? ''}
                onValueChange={(v) => setSelected((prev) => ({ ...prev, [group.key]: v }))}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Not selected" />
                </SelectTrigger>
                <SelectContent>
                  {group.choices
                    .filter((choice) => choice.key)
                    .map((choice) => (
                      <SelectItem key={choice.key} value={choice.key}>
                        {choice.label || choice.key}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          ))}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {result && (
        <div className="grid gap-1 text-sm sm:grid-cols-3">
          <p>
            Per unit: <span className="font-medium">${result.unitPrice.toFixed(2)}</span>
          </p>
          <p>
            One-time fees: <span className="font-medium">${result.flatFeeDelta.toFixed(2)}</span>
          </p>
          <p>
            Estimated load: <span className="font-medium">{result.totalWatts}W</span>
          </p>
        </div>
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
