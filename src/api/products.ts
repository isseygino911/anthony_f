import { api } from './client';
import type { Category, Paginated, Product, ProductGroup } from '../types';

export interface ProductQuery {
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
