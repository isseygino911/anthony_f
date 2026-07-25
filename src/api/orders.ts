import { api } from './client';
import type { Order, OrderSummary, Paginated, ShippingAddress } from '../types';

export function createOrder(shippingAddress: ShippingAddress) {
  return api.post<Order>('/orders', { shippingAddress });
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
