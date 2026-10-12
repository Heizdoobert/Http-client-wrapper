import { describe, it, expect, vi } from 'vitest';
import { QuickQuizClient, HttpClient } from '../src/client';
import { QuickQuizError } from '../src/errors';

describe('SDK HTTP Client & Error Handling', () => {
  const baseUrl = 'https://api.quickquiz.app';

  describe('Authorization header handling', () => {
    it('attaches Authorization: Bearer <token> when token is set in options', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: { user: 'alice' } }),
      });

      const client = new QuickQuizClient({
        baseUrl,
        token: 'test-token-123',
        fetch: mockFetch as unknown as typeof fetch,
      });

      const result = await client.request('/v1/test');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/test');
      expect(init?.headers?.['Authorization']).toBe('Bearer test-token-123');
      expect(result).toEqual({ user: 'alice' });
    });

    it('omits Authorization header when token is null or undefined', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: 'ok' }),
      });

      const clientWithoutToken = new QuickQuizClient({
        baseUrl,
        fetch: mockFetch as unknown as typeof fetch,
      });

      await clientWithoutToken.request('/v1/public');

      const [, init1] = mockFetch.mock.calls[0];
      expect(init1?.headers?.['Authorization']).toBeUndefined();

      const clientWithNull = new QuickQuizClient({
        baseUrl,
        token: null,
        fetch: mockFetch as unknown as typeof fetch,
      });

      await clientWithNull.request('/v1/public');

      const [, init2] = mockFetch.mock.calls[1];
      expect(init2?.headers?.['Authorization']).toBeUndefined();
    });

    it('updates Authorization header when setToken() is called', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: 'ok' }),
      });

      const client = new QuickQuizClient({
        baseUrl,
        fetch: mockFetch as unknown as typeof fetch,
      });

      // Initially no token
      await client.request('/v1/first');
      expect(mockFetch.mock.calls[0][1]?.headers?.['Authorization']).toBeUndefined();

      // Set token
      client.setToken('dynamic-jwt-token');
      await client.request('/v1/second');
      expect(mockFetch.mock.calls[1][1]?.headers?.['Authorization']).toBe('Bearer dynamic-jwt-token');

      // Clear token
      client.setToken(null);
      await client.request('/v1/third');
      expect(mockFetch.mock.calls[2][1]?.headers?.['Authorization']).toBeUndefined();
    });

    it('preserves caller-provided Authorization or authorization header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: 'ok' }),
      });

      const client = new QuickQuizClient({
        baseUrl,
        token: 'client-token',
        fetch: mockFetch as unknown as typeof fetch,
      });

      await client.request('/v1/custom-auth', {
        headers: { Authorization: 'Bearer custom-token' },
      });
      expect(mockFetch.mock.calls[0][1]?.headers?.['Authorization']).toBe('Bearer custom-token');

      await client.request('/v1/lowercase-auth', {
        headers: { authorization: 'Bearer lowercase-token' },
      });
      expect(mockFetch.mock.calls[1][1]?.headers?.['authorization']).toBe('Bearer lowercase-token');
      expect(mockFetch.mock.calls[1][1]?.headers?.['Authorization']).toBeUndefined();
    });
  });

  describe('Envelope unwrapping', () => {
    it('unwraps { success: true, data } envelope and returns data', async () => {
      const testData = {
        id: 'q-101',
        prompt: 'What is the speed of light?',
        options: ['300,000 km/s', '150,000 km/s'],
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: testData }),
      });

      const client = new QuickQuizClient({
        baseUrl,
        fetch: mockFetch as unknown as typeof fetch,
      });

      const data = await client.request<typeof testData>('/v1/questions/q-101');
      expect(data).toEqual(testData);
    });

    it('unwraps null or array data correctly in success envelope', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: null }),
      }).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: [1, 2, 3] }),
      });

      const client = new QuickQuizClient({
        baseUrl,
        fetch: mockFetch as unknown as typeof fetch,
      });

      const nullResult = await client.request('/v1/null-endpoint');
      expect(nullResult).toBeNull();

      const arrayResult = await client.request('/v1/array-endpoint');
      expect(arrayResult).toEqual([1, 2, 3]);
    });
  });

  describe('Error handling', () => {
    it('throws QuickQuizError with code, status, and details when { success: false, error } is returned', async () => {
      const errorPayload = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: { field: 'email', reason: 'format' },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ success: false, error: errorPayload }),
      });

      const client = new QuickQuizClient({
        baseUrl,
        fetch: mockFetch as unknown as typeof fetch,
      });

      try {
        await client.request('/v1/auth/signup', {
          method: 'POST',
          body: { email: 'bad' },
        });
        expect.unreachable('Should have thrown QuickQuizError');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(QuickQuizError);
        const qError = err as QuickQuizError;
        expect(qError.name).toBe('QuickQuizError');
        expect(qError.code).toBe('VALIDATION_ERROR');
        expect(qError.message).toBe('Invalid request payload');
        expect(qError.status).toBe(400);
        expect(qError.details).toEqual({ field: 'email', reason: 'format' });
      }
    });

    it('handles error envelope where error is a plain string', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ success: false, error: 'Unauthorized token' }),
      });

      const client = new QuickQuizClient({
        baseUrl,
        fetch: mockFetch as unknown as typeof fetch,
      });

      await expect(client.request('/v1/protected')).rejects.toThrowError(QuickQuizError);
      try {
        await client.request('/v1/protected');
      } catch (err: unknown) {
        const qError = err as QuickQuizError;
        expect(qError.code).toBe('UNKNOWN_ERROR');
        expect(qError.message).toBe('Unauthorized token');
        expect(qError.status).toBe(401);
      }
    });

    it('handles network error by throwing QuickQuizError with code NETWORK_ERROR', async () => {
      const networkFailure = new TypeError('Failed to fetch: Connection refused');
      const mockFetch = vi.fn().mockRejectedValue(networkFailure);

      const client = new QuickQuizClient({
        baseUrl,
        fetch: mockFetch as unknown as typeof fetch,
      });

      await expect(client.request('/v1/test')).rejects.toThrowError(QuickQuizError);
      try {
        await client.request('/v1/test');
      } catch (err: unknown) {
        const qError = err as QuickQuizError;
        expect(qError).toBeInstanceOf(QuickQuizError);
        expect(qError.code).toBe('NETWORK_ERROR');
        expect(qError.status).toBe(0);
        expect(qError.message).toContain('Failed to fetch');
      }
    });

    it('handles non-JSON error response gracefully by throwing QuickQuizError', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        text: async () => '<html>502 Bad Gateway</html>',
      });

      const client = new QuickQuizClient({
        baseUrl,
        fetch: mockFetch as unknown as typeof fetch,
      });

      await expect(client.request('/v1/down')).rejects.toThrowError(QuickQuizError);
      try {
        await client.request('/v1/down');
      } catch (err: unknown) {
        const qError = err as QuickQuizError;
        expect(qError).toBeInstanceOf(QuickQuizError);
        expect(qError.status).toBe(502);
      }
    });

    it('handles non-JSON 200 response gracefully by throwing QuickQuizError', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => 'Not valid JSON at all',
      });

      const client = new QuickQuizClient({
        baseUrl,
        fetch: mockFetch as unknown as typeof fetch,
      });

      await expect(client.request('/v1/corrupted')).rejects.toThrowError(QuickQuizError);
      try {
        await client.request('/v1/corrupted');
      } catch (err: unknown) {
        const qError = err as QuickQuizError;
        expect(qError).toBeInstanceOf(QuickQuizError);
        expect(qError.status).toBe(200);
      }
    });
  });

  describe('HTTP request formatting', () => {
    it('sets Content-Type: application/json and serializes JSON body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: { created: true } }),
      });

      const client = new QuickQuizClient({
        baseUrl,
        fetch: mockFetch as unknown as typeof fetch,
      });

      await client.request('/v1/questions', {
        method: 'POST',
        body: { prompt: 'Test?', options: ['A', 'B'] },
      });

      const [, init] = mockFetch.mock.calls[0];
      expect(init?.method).toBe('POST');
      expect(init?.headers?.['Content-Type']).toBe('application/json');
      expect(init?.body).toBe(JSON.stringify({ prompt: 'Test?', options: ['A', 'B'] }));
    });

    it('formats query parameters correctly', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: [] }),
      });

      const client = new QuickQuizClient({
        baseUrl: 'https://api.quickquiz.app/',
        fetch: mockFetch as unknown as typeof fetch,
      });

      await client.request('/v1/questions/random', {
        params: {
          category: 'Science',
          exclude: ['id1', 'id2'],
          limit: 10,
        },
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/questions/random?category=Science&exclude=id1%2Cid2&limit=10');
    });

    it('HttpClient instance can be used directly', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: 'direct' }),
      });

      const http = new HttpClient({
        baseUrl,
        token: 'direct-token',
        fetch: mockFetch as unknown as typeof fetch,
      });

      const res = await http.request('/v1/direct');
      expect(res).toBe('direct');
      expect(http.getToken()).toBe('direct-token');
    });
  });

  describe('Timeout, Signal, and Retry handling', () => {
    it('passes caller AbortSignal to fetch and rejects on abort', async () => {
      const controller = new AbortController();
      const mockFetch = vi.fn().mockImplementation((_url, init) => {
        expect(init?.signal).toBeDefined();
        if (init?.signal?.aborted) {
          throw new DOMException('The operation was aborted', 'AbortError');
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ success: true, data: 'done' }),
        });
      });

      const client = new HttpClient({ baseUrl, fetch: mockFetch as unknown as typeof fetch });
      controller.abort();

      await expect(client.request('/v1/cancel', { signal: controller.signal })).rejects.toThrow();
    });

    it('aborts with TIMEOUT_ERROR when request exceeds timeout', async () => {
      const mockFetch = vi.fn().mockImplementation((_url, init) => {
        return new Promise((_, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new DOMException('The operation was aborted due to timeout', 'TimeoutError');
            reject(err);
          });
        });
      });

      const client = new HttpClient({ baseUrl, fetch: mockFetch as unknown as typeof fetch });
      await expect(client.request('/v1/slow', { timeout: 10 })).rejects.toSatisfy((err: unknown) => {
        return err instanceof QuickQuizError && err.code === 'TIMEOUT_ERROR';
      });
    });

    it('retries idempotent GET on 503 and succeeds on subsequent attempt', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers(),
            body: { cancel: vi.fn() },
            text: async () => 'Service Unavailable',
          };
        }
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ success: true, data: 'recovered' }),
        };
      });

      const client = new HttpClient({ baseUrl, fetch: mockFetch as unknown as typeof fetch });
      const res = await client.request('/v1/flaky', { retries: 2, method: 'GET' });
      expect(res).toBe('recovered');
      expect(callCount).toBe(2);
    });

    it('does NOT retry non-idempotent POST even on 503 or network error', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        return {
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers(),
          body: { cancel: vi.fn() },
          text: async () => 'Service Unavailable',
        };
      });

      const client = new HttpClient({ baseUrl, fetch: mockFetch as unknown as typeof fetch });
      await expect(client.request('/v1/mutate', { method: 'POST', retries: 2 })).rejects.toThrow(QuickQuizError);
      expect(callCount).toBe(1);
    });

    it('does NOT retry on 4xx client errors', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          headers: new Headers(),
          text: async () => JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'Missing' } }),
        };
      });

      const client = new HttpClient({ baseUrl, fetch: mockFetch as unknown as typeof fetch });
      await expect(client.request('/v1/missing', { method: 'GET', retries: 2 })).rejects.toThrow(QuickQuizError);
      expect(callCount).toBe(1);
    });

    it('honors retries: 0 override even if client defaults configured', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        return {
          ok: false,
          status: 502,
          statusText: 'Bad Gateway',
          headers: new Headers(),
          body: { cancel: vi.fn() },
          text: async () => 'Bad Gateway',
        };
      });

      const client = new HttpClient({ baseUrl, retries: 3, fetch: mockFetch as unknown as typeof fetch });
      await expect(client.request('/v1/override', { method: 'GET', retries: 0 })).rejects.toThrow(QuickQuizError);
      expect(callCount).toBe(1);
    });
  });
});
