import { getConfig } from '@/api/config';
import { useAuthStore } from '@/store/useAuthStore';
import { ResponseRefreshApiModelSchema } from '@/api/schemas/user';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export class ApiError extends Error {
  public statusCode: number;
  public data: unknown;

  constructor(statusCode: number, data: unknown) {
    super(`API error ${statusCode}`);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const { apiBaseUrl } = getConfig();
      const response = await fetch(`${apiBaseUrl}/api/users/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data: unknown = await response.json();
      const parsed = ResponseRefreshApiModelSchema.safeParse(data);
      if (!parsed.success) {
        return null;
      }

      useAuthStore.getState().setAccessToken(parsed.data.accessToken);
      return parsed.data.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export { refreshAccessToken };

async function apiClientInternal<T>(
  path: string,
  method: HttpMethod,
  options?: { body?: unknown; signal?: AbortSignal; skipAuthRefresh?: boolean },
  isRetry?: boolean,
): Promise<T> {
  const { apiBaseUrl } = getConfig();
  const url = `${apiBaseUrl}${path}`;

  const headers: Record<string, string> = {};
  let body: string | undefined;

  if (options?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
    signal: options?.signal,
    credentials: 'include',
  });

  if (response.status === 401 && !isRetry && !options?.skipAuthRefresh) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiClientInternal<T>(path, method, options, true);
    }
    useAuthStore.getState().clearAuth();
    window.location.href = '/login';
    throw new ApiError(401, { message: 'Session expired' });
  }

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    throw new ApiError(response.status, errorData);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  const data: T = await response.json();
  return data;
}

export async function apiClient<T>(
  path: string,
  method: HttpMethod,
  options?: { body?: unknown; signal?: AbortSignal; skipAuthRefresh?: boolean },
): Promise<T> {
  return apiClientInternal<T>(path, method, options, false);
}
