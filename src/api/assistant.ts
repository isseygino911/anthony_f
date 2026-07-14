import { api } from './client';
import type { Product, DocumentResource } from '../types';

export interface AssistantReply {
  conversationId: number;
  reply: string;
  products: Product[];
  documents: DocumentResource[];
}

export function sendAssistantMessage(message: string, conversationId?: number) {
  return api.post<AssistantReply>('/assistant/messages', { message, conversationId });
}
