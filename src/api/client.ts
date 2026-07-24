/**
 * Single fetch wrapper for every API call (architecture.md §4, §9). Handles:
 *  - request URLs of the form `${VITE_API_URL}/api${path}` — with
 *    VITE_API_URL unset/empty this is a same-origin relative path (Vite dev
 *    proxy forwards /api/* to :4002, Caddy does the same in same-domain
 *    production setups); with VITE_API_URL set to an absolute origin (e.g.
 *    https://anthony-api.isseylab.com) requests go fully cross-origin, and
 *    rely on the backend's CORS config plus credentialed-cookie support to
 *    keep auth working
 *  - cookies (JWT / anon session / CSRF) via `credentials: 'include'`
 *  - echoing the CSRF cookie back as an `X-CSRF-Token` header on every
 *    mutating request (POST/PUT/PATCH/DELETE), per architecture.md §9
 *
 * Assumption (flagged for backend/architect alignment): the CSRF cookie name
 * is not spelled out verbatim in architecture.md §9, only that it is a
 * non-httpOnly double-submit cookie. This client reads it under the name
 * `csrf_token`. If the backend issues it under a different name, this is the
 * one place to change.
 */

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

interface RequestOptions {
  method?: string;
  body?: unknown;
  isFormData?: boolean;
  query?: Record<string, string | number | boolean | undefined>;
}

function buildQueryString(query?: RequestOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;

  if (options.isFormData) {
    body = options.body as FormData;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  if (MUTATING_METHODS.has(method)) {
    const csrfToken = readCookie(CSRF_COOKIE_NAME);
    if (csrfToken) headers[CSRF_HEADER_NAME] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}/api${path}${buildQueryString(options.query)}`, {
    method,
    headers,
    body,
    credentials: 'include',
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const err = payload?.error;
    throw new ApiError(
      response.status,
      err?.message ?? response.statusText ?? 'Request failed',
      err?.code,
      err?.details,
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query']) =>
    apiRequest<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
  postForm: <T>(path: string, formData: FormData) =>
    apiRequest<T>(path, { method: 'POST', body: formData, isFormData: true }),
};
