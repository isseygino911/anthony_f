import { api } from './client';
import type { Order, OrderSummary, Paginated, ShippingAddress } from '../types';

// `contact` is required only when the cart contains a custom-size item; the
// server decides that from the cart itself and 400s if it is missing, so it
// stays optional here (see contact.service.js#assertQuoteContact).
export interface QuoteContactPayload {
  name: string;
  email: string;
  phone: string;
  message?: string;
}

export function createOrder(shippingAddress: ShippingAddress, contact?: QuoteContactPayload) {
  return api.post<Order>('/orders', { shippingAddress, contact });
}

export function getMyOrders(query: { page?: number; pageSize?: number } = {}) {
  return api.get<Paginated<OrderSummary>>('/orders', { ...query });
}

export function getMyOrder(id: number | string) {
  return api.get<Order>(`/orders/${id}`);
}

export function createPaymentIntent(orderId: number | string) {
  return api.post<{ clientSecret: string }>(`/orders/${orderId}/create-payment-intent`);
}

export function cancelOrder(orderId: number | string) {
  return api.delete<void>(`/orders/${orderId}`);
}
