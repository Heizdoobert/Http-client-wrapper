import { isClient, getDefaultClient, type ClientLike } from './http';
import type { QuickQuizClient } from './client';
import type {
  GetUserQuizzesFilter,
  QuestionAnalytics,
  UserBackupData,
  UserQuizzesResult,
} from '../types';

/**
 * Get questions authored by the current user with optional filtering and pagination. Requires authentication.
 */
export async function getUserQuizzes(
  clientOrFilter?: ClientLike | (GetUserQuizzesFilter & { client?: ClientLike }),
  maybeFilter?: GetUserQuizzesFilter
): Promise<UserQuizzesResult> {
  let client: ClientLike;
  let filter: GetUserQuizzesFilter | undefined;

  if (isClient(clientOrFilter)) {
    client = clientOrFilter;
    filter = maybeFilter;
  } else {
    filter = clientOrFilter;
    client = clientOrFilter?.client ?? getDefaultClient();
  }

  return client.request<UserQuizzesResult>('/v1/profile/quizzes', {
    method: 'GET',
    query: {
      limit: filter?.limit,
      offset: filter?.offset,
      category: filter?.category,
      status: filter?.status,
    },
  });
}

/**
 * Export complete user account data (created quizzes and quiz history). Requires authentication.
 */
export async function exportUserData(
  clientOrOptions?: ClientLike | { client?: ClientLike }
): Promise<UserBackupData> {
  const client = isClient(clientOrOptions)
    ? clientOrOptions
    : (clientOrOptions?.client ?? getDefaultClient());

  return client.request<UserBackupData>('/v1/profile/export', {
    method: 'GET',
  });
}

export const exportProfileData = exportUserData;

/**
 * Get analytics on questions authored by the current user. Requires authentication.
 */
export async function getQuestionAnalytics(
  clientOrOptions?: ClientLike | { client?: ClientLike }
): Promise<QuestionAnalytics[]> {
  const client = isClient(clientOrOptions)
    ? clientOrOptions
    : (clientOrOptions?.client ?? getDefaultClient());

  return client.request<QuestionAnalytics[]>('/v1/profile/analytics', {
    method: 'GET',
  });
}

export class ProfileResource {
  constructor(private readonly client: QuickQuizClient) {}

  /**
   * Get questions authored by the current user with optional filtering and pagination. Requires authentication.
   */
  async quizzes(filter?: GetUserQuizzesFilter): Promise<UserQuizzesResult> {
    return getUserQuizzes(this.client, filter);
  }

  /**
   * Export complete user account data (created quizzes and quiz history). Requires authentication.
   */
  async export(): Promise<UserBackupData> {
    return exportUserData(this.client);
  }

  /**
   * Get analytics on questions authored by the current user. Requires authentication.
   */
  async analytics(): Promise<QuestionAnalytics[]> {
    return getQuestionAnalytics(this.client);
  }
}
