import { HttpClient } from '../client/http';
import { QuickQuizError } from '../errors';
import type { AuthSession } from '../types';

/** The account behind a token, exactly what `GET /v1/auth/session` returns. */
export type QuickQuizAccount = AuthSession;

export interface TokenVerifier {
  /** Resolves the account for a Bearer token, or `null` if Quick Quiz rejects it. Throws if Quick Quiz cannot answer. */
  verify(token: string): Promise<QuickQuizAccount | null>;
}

export interface TokenVerifierOptions {
  /**
   * Same `baseUrl` as `QuickQuizClient`: requests go to `${baseUrl}/v1/auth/session`,
   * so against a real deployment it ends in `/api` (e.g. `https://quickquiz.app/api`).
   */
  baseUrl: string;
  /** How long a verdict is reused, in milliseconds. Default 30000. */
  ttlMs?: number;
  /** Most verdicts kept in memory; the oldest is dropped first. Default 1000. */
  maxEntries?: number;
  fetch?: typeof globalThis.fetch;
}

const SESSION_PATH = '/v1/auth/session';

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function isAccount(value: unknown): value is QuickQuizAccount {
  const v = value as Partial<QuickQuizAccount> | null;
  return typeof v?.id === 'string' && typeof v?.username === 'string';
}

/**
 * Verifies tokens by asking Quick Quiz, caching each verdict in memory.
 * A 401 is a verdict (cached as `null`). Network errors, 429 and 5xx are not: they throw and are never cached.
 * Cache keys are SHA-256 digests, so raw tokens are not retained.
 */
export function createTokenVerifier(options: TokenVerifierOptions): TokenVerifier {
  const { baseUrl, ttlMs = 30_000, maxEntries = 1000, fetch } = options;
  const cache = new Map<string, { account: QuickQuizAccount | null; expiresAt: number }>();

  return {
    async verify(token) {
      const key = await sha256Hex(token);
      const hit = cache.get(key);
      if (hit && hit.expiresAt > Date.now()) return hit.account;

      let account: QuickQuizAccount | null;
      try {
        const data = await new HttpClient({ baseUrl, token, fetch }).request<unknown>(SESSION_PATH);
        if (!isAccount(data)) {
          throw new QuickQuizError('INVALID_RESPONSE', 'Unexpected session payload from Quick Quiz', 200);
        }
        account = { id: data.id, username: data.username };
      } catch (error) {
        if (error instanceof QuickQuizError && error.status === 401) {
          account = null;
        } else {
          throw error;
        }
      }

      // Re-insert so Map order stays oldest-first; every entry shares one TTL, so that is also expiry order.
      cache.delete(key);
      cache.set(key, { account, expiresAt: Date.now() + ttlMs });
      while (cache.size > maxEntries) cache.delete(cache.keys().next().value as string);
      return account;
    },
  };
}
