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
}

export function getProducts(query: ProductQuery = {}) {
  return api.get<Paginated<Product>>('/products', { ...query });
}

export function getProduct(id: number | string) {
  return api.get<Product>(`/products/${id}`);
}

export function getCategories() {
  return api.get<{ items: Category[] }>('/categories');
}

export function getGroups() {
  return api.get<{ items: ProductGroup[] }>('/groups');
}

export function getGroupProducts(groupId: number | string, query: { page?: number; pageSize?: number } = {}) {
  return api.get<Paginated<Product>>(`/groups/${groupId}/products`, { ...query });
}
