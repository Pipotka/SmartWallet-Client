import { getConfig } from '@/api/config';

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

export async function apiClient<T>(
  path: string,
  method: HttpMethod,
  options?: { body?: unknown; signal?: AbortSignal }
): Promise<T> {
  const { apiBaseUrl } = getConfig();
  const url = `${apiBaseUrl}${path}`;

  const headers: Record<string, string> = {};
  let body: string | undefined;

  if (options?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
    signal: options?.signal,
    credentials: 'include',
  });

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
