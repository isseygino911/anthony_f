import { api, ApiError, API_BASE_URL } from './client';
import type {
  AdminOrder,
  Category,
  CustomNeonDesign,
  CustomNeonDesignStatus,
  CustomNeonUsageRow,
  DocumentResource,
  Notification,
  Order,
  OrderAuditLogEntry,
  OrderStatus,
  OrderSummary,
  Paginated,
  Product,
  ProductGroup,
  ProductImage,
  ProductSeo,
  RevenuePoint,
} from '../types';

// ---- Products ----

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  sku: string;
  category_id: number;
  tags?: string[];
  is_featured?: boolean;
  is_bestseller?: boolean;
  is_clearance?: boolean;
  stock_quantity: number;
  low_stock_threshold?: number | null;
}

export function createProduct(input: ProductInput) {
  return api.post<Product>('/admin/products', input);
}

export function updateProduct(id: number, input: Partial<ProductInput>) {
  return api.put<Product>(`/admin/products/${id}`, input);
}

export function deleteProduct(id: number) {
  return api.delete<void>(`/admin/products/${id}`);
}

export function bulkDeleteProducts(ids: number[]) {
  return api.post<{ softDeleted: number[] }>('/admin/products/bulk-delete', { ids });
}

export function setProductActive(id: number, isActive: boolean) {
  return api.patch<Product>(`/admin/products/${id}/status`, { is_active: isActive });
}

export function uploadProductImages(productId: number, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  return api.postForm<{ images: ProductImage[] }>(`/admin/products/${productId}/images`, formData);
}

export function setPrimaryImage(productId: number, imageId: number) {
  return api.patch<ProductImage>(`/admin/products/${productId}/images/${imageId}`, {
    is_primary: true,
  });
}

export function deleteProductImage(productId: number, imageId: number) {
  return api.delete<void>(`/admin/products/${productId}/images/${imageId}`);
}

export function replaceProductGroups(productId: number, groupIds: number[]) {
  return api.put<{ groupIds: number[] }>(`/admin/products/${productId}/groups`, { groupIds });
}

// Generated asynchronously by the seo-geo-agent worker after a product is
// created/updated — 404s until the worker has processed it (status: 'pending').
export function getProductSeo(productId: number) {
  return api.get<ProductSeo>(`/admin/products/${productId}/seo`);
}

// ---- Categories ----

export function createCategory(input: { name: string; slug: string }) {
  return api.post<Category>('/admin/categories', input);
}

export function updateCategory(id: number, input: { name?: string; slug?: string }) {
  return api.put<Category>(`/admin/categories/${id}`, input);
}

export function deleteCategory(id: number) {
  return api.delete<void>(`/admin/categories/${id}`);
}

// ---- Groups ----

export function createGroup(input: { name: string; description?: string }) {
  return api.post<ProductGroup>('/admin/groups', input);
}

export function updateGroup(id: number, input: { name?: string; description?: string }) {
  return api.put<ProductGroup>(`/admin/groups/${id}`, input);
}

export function deleteGroup(id: number) {
  return api.delete<void>(`/admin/groups/${id}`);
}

export function replaceGroupProducts(groupId: number, productIds: number[]) {
  return api.put<{ productIds: number[] }>(`/admin/groups/${groupId}/products`, { productIds });
}

// ---- Orders ----

export interface AdminOrderQuery {
  status?: OrderStatus;
  page?: number;
  pageSize?: number;
  search?: string;
}

export function getAdminOrders(query: AdminOrderQuery = {}) {
  return api.get<Paginated<OrderSummary>>('/admin/orders', { ...query });
}

export function getAdminOrder(id: number | string) {
  return api.get<AdminOrder>(`/admin/orders/${id}`);
}

export type OrderAdjustmentType =
  | 'discount'
  | 'refund'
  | 'shipping_change'
  | 'manual_adjustment'
  | 'status_change';

export interface OrderAdjustmentInput {
  type: OrderAdjustmentType;
  amount?: number;
  newStatus?: OrderStatus;
  reason?: string;
}

export function adjustOrder(id: number, input: OrderAdjustmentInput) {
  return api.patch<{ order: Order; auditLogEntry: OrderAuditLogEntry }>(`/admin/orders/${id}`, input);
}

// Binary PDF response — the shared `api` wrapper is JSON-only, so this is a
// standalone fetch that mirrors client.ts's base-URL + credentials handling.
export async function downloadInvoice(id: number | string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/orders/${id}/invoice`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? await response.json().catch(() => null) : null;
    const err = payload?.error;
    throw new ApiError(
      response.status,
      err?.message ?? response.statusText ?? 'Failed to download invoice',
      err?.code,
      err?.details,
    );
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---- Notifications ----

export function getNotifications(query: { unreadOnly?: boolean; page?: number; pageSize?: number } = {}) {
  return api.get<{ items: Notification[]; unreadCount: number }>('/admin/notifications', { ...query });
}

export function markNotificationRead(id: number) {
  return api.patch<Notification>(`/admin/notifications/${id}/read`);
}

export function markAllNotificationsRead() {
  return api.patch<void>('/admin/notifications/read-all');
}

// ---- Documents ----

export function uploadDocument(input: { title: string; category?: string; file: File }) {
  const formData = new FormData();
  formData.append('title', input.title);
  if (input.category) formData.append('category', input.category);
  formData.append('file', input.file);
  return api.postForm<DocumentResource>('/admin/documents', formData);
}

export function updateDocument(id: number, input: { title?: string; category?: string; sort_order?: number }) {
  return api.put<DocumentResource>(`/admin/documents/${id}`, input);
}

export function deleteDocument(id: number) {
  return api.delete<void>(`/admin/documents/${id}`);
}

// ---- Custom Neon Designs ----

export function getAdminCustomNeonDesigns(query: { status?: CustomNeonDesignStatus; page?: number; pageSize?: number } = {}) {
  return api.get<Paginated<CustomNeonDesign>>('/admin/custom-neon-designs', { ...query });
}

export function getAdminCustomNeonDesign(id: number | string) {
  return api.get<CustomNeonDesign>(`/admin/custom-neon-designs/${id}`);
}

export function updateAdminCustomNeonDesignNotes(id: number, adminNotes: string) {
  return api.patch<CustomNeonDesign>(`/admin/custom-neon-designs/${id}`, { admin_notes: adminNotes });
}

export function getAdminCustomNeonUsage(query: { page?: number; pageSize?: number } = {}) {
  return api.get<Paginated<CustomNeonUsageRow>>('/admin/custom-neon-usage', { ...query });
}

// ---- Newsletter ----

export interface NewsletterSubscriber {
  id: number;
  email: string;
  subscribed_at: string;
}

export function getNewsletterSubscribers(query: { page?: number; pageSize?: number } = {}) {
  return api.get<Paginated<NewsletterSubscriber>>('/admin/newsletter/subscribers', { ...query });
}

// ---- Dashboard ----

export function getRevenue(query: { granularity: 'daily' | 'monthly'; from?: string; to?: string }) {
  return api.get<{ series: RevenuePoint[] }>('/admin/dashboard/revenue', { ...query });
}
