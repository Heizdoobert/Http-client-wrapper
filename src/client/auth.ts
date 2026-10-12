import { isClient, getDefaultClient, type ClientLike } from './http';
import type { QuickQuizClient } from './client';
import type { AuthResult, AuthSession, VerifyEmailResult } from '../types';

/**
 * Register a new user account with username and password.
 * On success, updates the client's auth token if supported.
 */
export async function signUp(
  arg1: ClientLike | string | { username: string; password: string; client?: ClientLike },
  arg2?: string | { username: string; password: string },
  arg3?: string
): Promise<AuthResult> {
  let client: ClientLike;
  let username: string;
  let password = '';

  if (isClient(arg1)) {
    client = arg1;
    if (typeof arg2 === 'string') {
      username = arg2;
      password = arg3 ?? '';
    } else {
      username = arg2?.username ?? '';
      password = arg2?.password ?? '';
    }
  } else if (typeof arg1 === 'string') {
    client = getDefaultClient();
    username = arg1;
    password = typeof arg2 === 'string' ? arg2 : '';
  } else {
    client = arg1?.client ?? getDefaultClient();
    username = arg1.username;
    password = arg1.password;
  }

  const res = await client.request<AuthResult>('/v1/auth/signup', {
    method: 'POST',
    body: { username, password },
  });
  if (typeof client.setToken === 'function') {
    client.setToken(res.token);
  }
  return res;
}

/**
 * Sign in with username and password.
 * On success, updates the client's auth token if supported.
 */
export async function signIn(
  arg1: ClientLike | string | { username: string; password: string; client?: ClientLike },
  arg2?: string | { username: string; password: string },
  arg3?: string
): Promise<AuthResult> {
  let client: ClientLike;
  let username: string;
  let password = '';

  if (isClient(arg1)) {
    client = arg1;
    if (typeof arg2 === 'string') {
      username = arg2;
      password = arg3 ?? '';
    } else {
      username = arg2?.username ?? '';
      password = arg2?.password ?? '';
    }
  } else if (typeof arg1 === 'string') {
    client = getDefaultClient();
    username = arg1;
    password = typeof arg2 === 'string' ? arg2 : '';
  } else {
    client = arg1?.client ?? getDefaultClient();
    username = arg1.username;
    password = arg1.password;
  }

  const res = await client.request<AuthResult>('/v1/auth/signin', {
    method: 'POST',
    body: { username, password },
  });
  if (typeof client.setToken === 'function') {
    client.setToken(res.token);
  }
  return res;
}

/**
 * Sign in using a Google OAuth ID token.
 * On success, updates the client's auth token if supported.
 */
export async function signInWithGoogle(
  arg1: ClientLike | string | { idToken: string; client?: ClientLike },
  arg2?: string | { idToken: string }
): Promise<AuthResult> {
  let client: ClientLike;
  let idToken: string;

  if (isClient(arg1)) {
    client = arg1;
    idToken = typeof arg2 === 'string' ? arg2 : (arg2?.idToken ?? '');
  } else if (typeof arg1 === 'string') {
    client = getDefaultClient();
    idToken = arg1;
  } else {
    client = arg1?.client ?? getDefaultClient();
    idToken = arg1.idToken;
  }

  const res = await client.request<AuthResult>('/v1/auth/signin/google', {
    method: 'POST',
    body: { idToken },
  });
  if (typeof client.setToken === 'function') {
    client.setToken(res.token);
  }
  return res;
}

/**
 * Request a single-use verification code sent via email.
 */
export async function requestEmailCode(
  arg1: ClientLike | string | { email: string; client?: ClientLike },
  arg2?: string | { email: string }
): Promise<{ sent: boolean }> {
  let client: ClientLike;
  let email: string;

  if (isClient(arg1)) {
    client = arg1;
    email = typeof arg2 === 'string' ? arg2 : (arg2?.email ?? '');
  } else if (typeof arg1 === 'string') {
    client = getDefaultClient();
    email = arg1;
  } else {
    client = arg1?.client ?? getDefaultClient();
    email = arg1.email;
  }

  return client.request<{ sent: boolean }>('/v1/auth/email/request', {
    method: 'POST',
    body: { email },
  });
}

/**
 * Verify an email code and establish a session.
 * On success, updates the client's auth token if supported.
 */
export async function verifyEmailCode(
  arg1: ClientLike | string | { email: string; code: string; client?: ClientLike },
  arg2?: string | { email: string; code: string },
  arg3?: string
): Promise<VerifyEmailResult> {
  let client: ClientLike;
  let email: string;
  let code = '';

  if (isClient(arg1)) {
    client = arg1;
    if (typeof arg2 === 'string') {
      email = arg2;
      code = arg3 ?? '';
    } else {
      email = arg2?.email ?? '';
      code = arg2?.code ?? '';
    }
  } else if (typeof arg1 === 'string') {
    client = getDefaultClient();
    email = arg1;
    code = typeof arg2 === 'string' ? arg2 : '';
  } else {
    client = arg1?.client ?? getDefaultClient();
    email = arg1.email;
    code = arg1.code;
  }

  const res = await client.request<VerifyEmailResult>('/v1/auth/email/verify', {
    method: 'POST',
    body: { email, code },
  });
  if (res.token && typeof client.setToken === 'function') {
    client.setToken(res.token);
  }
  return res;
}

/**
 * Get current authenticated user session information.
 */
export async function getSession(
  clientOrOptions?: ClientLike | { client?: ClientLike }
): Promise<AuthSession> {
  const client = isClient(clientOrOptions)
    ? clientOrOptions
    : (clientOrOptions?.client ?? getDefaultClient());

  return client.request<AuthSession>('/v1/auth/session', {
    method: 'GET',
  });
}

export const session = getSession;

/**
 * Terminate current session and clear stored auth token.
 */
export async function signOut(
  clientOrOptions?: ClientLike | { client?: ClientLike }
): Promise<{ ok: boolean }> {
  const client = isClient(clientOrOptions)
    ? clientOrOptions
    : (clientOrOptions?.client ?? getDefaultClient());

  try {
    return await client.request<{ ok: boolean }>('/v1/auth/signout', {
      method: 'POST',
    });
  } finally {
    if (typeof client.setToken === 'function') {
      client.setToken(null);
    }
  }
}

export class AuthResource {
  constructor(private readonly client: QuickQuizClient) {}

  /**
   * Register a new user account with username and password.
   * On success, updates the client's auth token.
   */
  signUp(
    usernameOrParams: string | { username: string; password: string },
    maybePassword?: string
  ): Promise<AuthResult> {
    return signUp(this.client, usernameOrParams as string, maybePassword);
  }

  /**
   * Sign in with username and password.
   * On success, updates the client's auth token.
   */
  signIn(
    usernameOrParams: string | { username: string; password: string },
    maybePassword?: string
  ): Promise<AuthResult> {
    return signIn(this.client, usernameOrParams as string, maybePassword);
  }

  /**
   * Sign in using a Google OAuth ID token.
   * On success, updates the client's auth token.
   */
  signInWithGoogle(idTokenOrParams: string | { idToken: string }): Promise<AuthResult> {
    return signInWithGoogle(this.client, idTokenOrParams);
  }

  /**
   * Request a single-use verification code sent via email.
   */
  requestEmailCode(emailOrParams: string | { email: string }): Promise<{ sent: boolean }> {
    return requestEmailCode(this.client, emailOrParams);
  }

  /**
   * Verify an email code and establish a session.
   * On success, updates the client's auth token.
   */
  verifyEmailCode(
    emailOrParams: string | { email: string; code: string },
    maybeCode?: string
  ): Promise<VerifyEmailResult> {
    return verifyEmailCode(this.client, emailOrParams as string, maybeCode);
  }

  /**
   * Get current authenticated user session information.
   */
  session(): Promise<AuthSession> {
    return getSession(this.client);
  }

  /**
   * Terminate current session and clear stored auth token.
   */
  signOut(): Promise<{ ok: boolean }> {
    return signOut(this.client);
  }
}
