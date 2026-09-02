import { api } from './client';
import type { CustomerNotification, Paginated } from '../types';

// Customer-facing notifications (customer_notifications). Distinct from the
// admin notification bell in api/admin.ts: these are scoped to the signed-in
// customer server-side, so no user id is sent or accepted here.
export interface CustomerNotificationPage extends Paginated<CustomerNotification> {
  unreadCount: number;
}

export function listMyNotifications(query: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}) {
  return api.get<CustomerNotificationPage>('/notifications', { ...query });
}

export function markNotificationRead(id: number) {
  return api.patch<CustomerNotification>(`/notifications/${id}/read`, {});
}

export function markAllNotificationsRead() {
  return api.patch<void>('/notifications/read-all', {});
}
