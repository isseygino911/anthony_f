import { api } from './client';
import type { AdminAnalyticsResult, AdminChatTurn } from '../types';

export function sendAdminAnalyticsQuery(message: string, history: AdminChatTurn[]) {
  return api.post<AdminAnalyticsResult>('/admin/analytics/query', { message, history });
}
