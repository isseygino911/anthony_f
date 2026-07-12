import { api } from './client';
import type { User } from '../types';

export function register(input: { email: string; password: string; name: string }) {
  return api.post<{ user: User }>('/auth/register', input);
}

export function login(input: { email: string; password: string }) {
  return api.post<{ user: User }>('/auth/login', input);
}

export function logout() {
  return api.post<void>('/auth/logout');
}

export function getMe() {
  return api.get<{ user: User }>('/auth/me');
}

/** Real redirect flow — navigates the browser away, not a fetch call. */
export function googleLoginUrl(): string {
  return '/api/auth/google';
}
