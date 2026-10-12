import type { TokenVerifier, QuickQuizAccount } from './verifier';
import { authenticate, type AuthOptions } from './authenticate';

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
