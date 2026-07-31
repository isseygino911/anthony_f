import { api } from './client';
import type { Category, Paginated, PricingConfig, Product, ProductGroup, ProductOptionGroup } from '../types';

interface ProductQuery {
  category?: string;
  group?: string;
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  tag?: string;
  // Admin management screens only: also return disabled products. Never set
  // this from storefront pages — a logged-in admin browsing the storefront
  // must see exactly what a customer sees.
  includeInactive?: boolean;
}

export function getProducts(query: ProductQuery = {}) {
  return api.get<Paginated<Product>>('/products', { ...query });
}

export function getProduct(id: number | string, opts: { includeInactive?: boolean } = {}) {
  return api.get<Product>(`/products/${id}`, opts.includeInactive ? { includeInactive: true } : undefined);
}

export function getCategories() {
  return api.get<{ items: Category[] }>('/categories');
}

export function getGroups() {
  return api.get<{ items: ProductGroup[] }>('/groups');
}

export function getGroupProducts(
  groupId: number | string,
  query: { page?: number; pageSize?: number; includeInactive?: boolean } = {},
) {
  return api.get<Paginated<Product>>(`/groups/${groupId}/products`, { ...query });
}

// Configurable-product option groups/choices (public read — storefront
// product detail page needs this to render the size/options configurator).
export function getProductOptions(productId: number | string) {
  return api.get<{ groups: ProductOptionGroup[] }>(`/products/${productId}/options`);
}

// Server-computed price preview for a candidate selection, before
// add-to-cart — never compute this client-side (pricing.service.js is the
// single source of truth, mirrors architecture.md §0's order-total rule).
// pricingConfigOverride is admin-only (rejected with 403 otherwise): it lets
// the formula builder preview an unsaved draft through this same endpoint,
// rather than approximating the price client-side.
export function previewProductPrice(
  productId: number | string,
  input: {
    sizeInches?: number;
    selectedOptions?: Record<string, string>;
    pricingConfigOverride?: PricingConfig | null;
  },
) {
  return api.post<{ unitPrice: number; flatFeeDelta: number; totalWatts: number }>(
    `/products/${productId}/price-preview`,
    input,
  );
}
