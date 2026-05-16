import { toast } from 'sonner';

import { refreshAdminAccessToken, shouldAttemptAdminTokenRefresh } from '@/lib/admin-token-refresh';
import { getApiBaseUrl } from '@/lib/env';

export interface IApiSuccessEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: IListMeta;
  errors?: unknown;
}

export interface IListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ApiCallError extends Error {
  public readonly status: number;

  public readonly payload: unknown;

  public constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiCallError';
    this.status = status;
    this.payload = payload;
  }
}

function buildQueryString(query: Record<string, string | number | undefined> | undefined): string {
  if (!query) {
    return '';
  }
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return;
    }
    params.set(key, String(value));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

interface IApiRequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  query?: Record<string, string | number | undefined>;
  /** When true, failed requests do not open a global toast (e.g. best-effort logout). */
  skipErrorToast?: boolean;
  _retryAfterRefresh?: boolean;
}

async function executeApiRequest<T>(path: string, options: IApiRequestOptions): Promise<IApiSuccessEnvelope<T>> {
  const base = getApiBaseUrl();
  const method = options.method ?? 'GET';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}${normalizedPath}${buildQueryString(options.query)}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  let body: string | undefined;
  if (options.body !== undefined && method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }
  let response: Response;
  try {
    response = await fetch(url, { method, headers, body });
  } catch {
    if (!options.skipErrorToast && typeof window !== 'undefined') {
      toast.error('Network error. Check your connection and try again.');
    }
    throw new ApiCallError('Network error', 0, null);
  }
  let json: IApiSuccessEnvelope<T>;
  try {
    json = (await response.json()) as IApiSuccessEnvelope<T>;
  } catch {
    if (!options.skipErrorToast && typeof window !== 'undefined') {
      toast.error('Could not read the server response.');
    }
    throw new ApiCallError('Invalid JSON response', response.status, null);
  }
  const hadBearerToken = Boolean(options.token);
  if (shouldAttemptAdminTokenRefresh(response.status, hadBearerToken, normalizedPath, Boolean(options._retryAfterRefresh))) {
    const newAccess = await refreshAdminAccessToken();
    if (newAccess) {
      return executeApiRequest<T>(path, {
        ...options,
        token: newAccess,
        _retryAfterRefresh: true,
      });
    }
  }
  if (!response.ok || json.success === false) {
    const message =
      typeof json.message === 'string' && json.message.length > 0
        ? json.message
        : `Request failed (${response.status})`;
    if (!options.skipErrorToast && typeof window !== 'undefined') {
      toast.error(message);
    }
    throw new ApiCallError(message, response.status, json);
  }
  return json;
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string | null;
    query?: Record<string, string | number | undefined>;
    /** When true, failed requests do not open a global toast (e.g. best-effort logout). */
    skipErrorToast?: boolean;
  } = {},
): Promise<IApiSuccessEnvelope<T>> {
  return executeApiRequest<T>(path, options);
}
