import { api } from './client';
import type { DocumentResource } from '../types';

export function getDocuments() {
  return api.get<{ items: DocumentResource[] }>('/documents');
}

export function getDocumentDetail(id: number | string) {
  return api.get<DocumentResource>(`/documents/${id}`);
}
