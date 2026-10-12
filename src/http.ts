import { QuickQuizError } from './errors';

export interface HttpClientOptions {
  baseUrl: string;
  token?: string | null;
  fetch?: typeof globalThis.fetch;
}

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string> | HeadersInit;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null | Array<string | number>>;
  query?: Record<string, string | number | boolean | undefined | null | Array<string | number>>;
}

export interface ClientLike {
  request<T>(path: string, options?: RequestOptions): Promise<T>;
  setToken?(token: string | null): void;
  getToken?(): string | null;
}

let defaultClient: ClientLike | null = null;

export function setDefaultClient(client: ClientLike | null): void {
  defaultClient = client;
}

export function getDefaultClient(): ClientLike {
  if (!defaultClient) {
    throw new QuickQuizError(
      'CLIENT_ERROR',
      'No QuickQuiz client provided and no default client configured. Pass a client or call setDefaultClient().',
      0
    );
  }
  return defaultClient;
}

export function isClient(value: unknown): value is ClientLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { request?: unknown }).request === 'function'
  );
}

export class HttpClient {
  private baseUrl: string;
  private token: string | null;
  private customFetch?: typeof globalThis.fetch;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl;
    this.token = options.token ?? null;
    this.customFetch = options.fetch;
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const cleanBase = this.baseUrl.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    let url = `${cleanBase}${cleanPath}`;

    const queryParams = options.params ?? options.query;
    if (queryParams) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            searchParams.set(key, value.join(','));
          } else {
            searchParams.set(key, String(value));
          }
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }

    const headers: Record<string, string> = {};

    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        for (const [key, value] of options.headers) {
          headers[key] = value;
        }
      } else {
        Object.assign(headers, options.headers);
      }
    }

    if (this.token && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    let body: BodyInit | undefined = undefined;
    if (options.body !== undefined) {
      if (typeof options.body === 'string') {
        body = options.body;
      } else {
        body = JSON.stringify(options.body);
      }
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    const fetchFn = this.customFetch ?? globalThis.fetch;
    if (!fetchFn) {
      throw new QuickQuizError('CLIENT_ERROR', 'Fetch is not available in the current environment', 0);
    }

    let response: Response;
    try {
      response = await fetchFn(url, {
        method: options.method ?? 'GET',
        headers,
        body,
      });
    } catch (error: unknown) {
      if (error instanceof QuickQuizError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Network request failed';
      throw new QuickQuizError('NETWORK_ERROR', message, 0, error);
    }

    let text: string;
    try {
      text = await response.text();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to read response body';
      throw new QuickQuizError('NETWORK_ERROR', message, response.status, error);
    }

    let parsed: unknown = null;
    if (text.trim() !== '') {
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new QuickQuizError(
          response.ok ? 'INVALID_JSON' : (response.status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR'),
          `Invalid JSON response: ${text.slice(0, 100)}`.trim(),
          response.status,
          { raw: text }
        );
      }
    }

    if (parsed && typeof parsed === 'object' && 'success' in parsed) {
      const enveloped = parsed as { success: boolean; data?: unknown; error?: unknown };
      if (enveloped.success === true) {
        return enveloped.data as T;
      }

      const errPayload = enveloped.error;
      let code = 'UNKNOWN_ERROR';
      let message = 'An error occurred';
      let details: unknown = undefined;

      if (typeof errPayload === 'string') {
        message = errPayload;
      } else if (errPayload && typeof errPayload === 'object') {
        const errObj = errPayload as { code?: string; message?: string; details?: unknown };
        code = errObj.code ?? code;
        message = errObj.message ?? message;
        details = errObj.details;
      }

      throw new QuickQuizError(code, message, response.status, details);
    }

    if (!response.ok) {
      const errObj = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
      const code = (errObj?.code as string) || (response.status >= 500 ? 'SERVER_ERROR' : 'HTTP_ERROR');
      const message =
        (errObj?.message as string) ||
        (errObj?.error as string) ||
        response.statusText ||
        `HTTP error ${response.status}`;
      const details = errObj?.details ?? parsed;
      throw new QuickQuizError(code, message, response.status, details);
    }

    return parsed as T;
  }
}
