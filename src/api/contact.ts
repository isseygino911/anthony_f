import { api } from './client';
import type { ContactSubmission, ContactTopic } from '../types';

export interface ContactSubmissionInput {
  topic: ContactTopic;
  name: string;
  email: string;
  phone: string;
  company?: string;
  message: string;
}

export function submitContactForm(input: ContactSubmissionInput) {
  return api.post<ContactSubmission>('/contact', input);
}
