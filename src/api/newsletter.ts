import { api } from './client';

export function subscribeNewsletter(email: string) {
  return api.post<{ subscribed: boolean }>('/newsletter/subscribe', { email });
}
