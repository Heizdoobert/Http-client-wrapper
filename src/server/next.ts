import type { TokenVerifier, QuickQuizAccount } from './verifier';
import { authenticate, type AuthOptions } from './authenticate';

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
