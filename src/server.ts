import { HttpClient } from './http';
import { QuickQuizError } from './errors';
import type { AuthSession } from './types';

// Re-exported so `instanceof` works against the copy of the class that `verify()` throws.
export { QuickQuizError } from './errors';

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

/** Extracts the token from an `Authorization: Bearer <token>` header value, or `null`. */
export function getBearerToken(header: string | string[] | null | undefined): string | null {
  const value = Array.isArray(header) ? (header.length === 1 ? header[0] : null) : header;
  return value?.match(/^bearer\s+(\S+)\s*$/i)?.[1] ?? null;
}

export interface AuthOptions {
  /**
   * Let requests without a valid token through with `account: null` instead of answering 401.
   * Also applies when Quick Quiz cannot be reached: the request continues as anonymous.
   */
  optional?: boolean;
  /** Called when Quick Quiz cannot be reached or answers unexpectedly (required mode then answers 503). */
  onError?: (error: unknown) => void;
}

/** REST error envelope, same shape and messages as the Quick Quiz API. */
export interface AuthFailure {
  status: number;
  body: { success: false; error: { code: string; message: string } };
}

const failure = (status: number, code: string, message: string): AuthFailure => ({
  status,
  body: { success: false, error: { code, message } },
});

const MISSING = failure(401, 'UNAUTHORIZED', 'Authentication token required');
const INVALID = failure(401, 'UNAUTHORIZED', 'Invalid or expired token');
const UPSTREAM = failure(503, 'UPSTREAM_UNAVAILABLE', 'Authentication service unavailable');

/** Shared by the framework adapters: an account (or `null` when optional), or the failure to answer with. */
export async function authenticate(
  verifier: TokenVerifier,
  authorization: string | string[] | null | undefined,
  { optional = false, onError }: AuthOptions = {},
): Promise<{ account: QuickQuizAccount | null } | { failure: AuthFailure }> {
  const token = getBearerToken(authorization);
  if (!token) return optional ? { account: null } : { failure: MISSING };

  let account: QuickQuizAccount | null;
  try {
    account = await verifier.verify(token);
  } catch (error) {
    try {
      onError?.(error);
    } catch {
      // A broken logger must not turn an upstream outage into an unhandled rejection.
    }
    return optional ? { account: null } : { failure: UPSTREAM };
  }

  if (account || optional) return { account };
  return { failure: INVALID };
}

type Account<Optional extends boolean> = Optional extends true ? QuickQuizAccount | null : QuickQuizAccount;

/**
 * Wraps a Next.js App Router route handler. The handler receives the verified account as a third argument.
 * With `{ optional: true }` it receives `null` for anonymous requests instead of the wrapper answering 401.
 */
export function withQuickQuizAuth<Req extends Request, Ctx, Optional extends boolean = false>(
  verifier: TokenVerifier,
  handler: (req: Req, ctx: Ctx, account: Account<Optional>) => Response | Promise<Response>,
  options: AuthOptions & { optional?: Optional } = {},
): (req: Req, ctx: Ctx) => Promise<Response> {
  return async (req, ctx) => {
    const result = await authenticate(verifier, req.headers.get('authorization'), options);
    if ('failure' in result) return Response.json(result.failure.body, { status: result.failure.status });
    // `authenticate` returns a null account only when `optional` is set, which is exactly when Account admits null.
    return handler(req, ctx, result.account as Account<Optional>);
  };
}

/** The part of an Express request this middleware touches; Express's own `Request` satisfies it. */
export interface QuickQuizRequest {
  headers: { authorization?: string | string[] };
  /** Set by the middleware: the verified account, or `null` in optional mode without a valid token. */
  quickQuizAccount?: QuickQuizAccount | null;
}

/** The part of an Express response this middleware touches. */
export interface QuickQuizResponse {
  status(code: number): { json(body: unknown): unknown };
}

/**
 * Express middleware that verifies `Authorization: Bearer <token>` and sets `req.quickQuizAccount`.
 * Failures are answered here and never forwarded to `next(err)`.
 */
export function quickQuizAuth(verifier: TokenVerifier, options: AuthOptions = {}) {
  return async (req: QuickQuizRequest, res: QuickQuizResponse, next: () => void): Promise<void> => {
    const result = await authenticate(verifier, req.headers.authorization, options);
    if ('failure' in result) {
      res.status(result.failure.status).json(result.failure.body);
      return;
    }
    req.quickQuizAccount = result.account;
    next();
  };
}
