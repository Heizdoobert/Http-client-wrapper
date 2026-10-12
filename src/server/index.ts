// Re-exported so `instanceof` works against the copy of the class that `verify()` throws.
export { QuickQuizError } from '../errors';

export type {
  QuickQuizAccount,
  TokenVerifier,
  TokenVerifierOptions,
} from './verifier';
export { createTokenVerifier } from './verifier';

export type {
  AuthOptions,
  AuthFailure,
} from './authenticate';
export {
  getBearerToken,
  authenticate,
} from './authenticate';

export { withQuickQuizAuth } from './next';

export type {
  QuickQuizRequest,
  QuickQuizResponse,
} from './express';
export { quickQuizAuth } from './express';
