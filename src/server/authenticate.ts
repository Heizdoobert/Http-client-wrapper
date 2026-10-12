import type { TokenVerifier, QuickQuizAccount } from './verifier';

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
