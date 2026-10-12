import { isClient, getDefaultClient, type ClientLike } from './http';
import type { QuickQuizClient } from './client';
import type { LeaderboardEntry, PaginationParams } from './types';

/**
 * Get the global top player leaderboard.
 */
export async function getGlobalLeaderboard(
  clientOrParams?: ClientLike | (PaginationParams & { client?: ClientLike }),
  maybeParams?: PaginationParams
): Promise<LeaderboardEntry[]> {
  let client: ClientLike;
  let params: PaginationParams | undefined;

  if (isClient(clientOrParams)) {
    client = clientOrParams;
    params = maybeParams;
  } else {
    params = clientOrParams;
    client = clientOrParams?.client ?? getDefaultClient();
  }

  return client.request<LeaderboardEntry[]>('/v1/leaderboard', {
    method: 'GET',
    query: {
      limit: params?.limit,
      offset: params?.offset,
    },
  });
}

export const globalLeaderboard = getGlobalLeaderboard;

/**
 * Get the leaderboard for a specific group. Requires authentication and membership in the group.
 */
export async function getGroupLeaderboard(
  clientOrGroupId: ClientLike | string | ({ groupId: string; client?: ClientLike } & PaginationParams),
  groupIdOrParams?: string | ({ groupId: string } & PaginationParams) | PaginationParams,
  maybeParams?: PaginationParams
): Promise<LeaderboardEntry[]> {
  let client: ClientLike;
  let groupId = '';
  let limit: number | undefined;
  let offset: number | undefined;

  if (isClient(clientOrGroupId)) {
    client = clientOrGroupId;
    if (typeof groupIdOrParams === 'string') {
      groupId = groupIdOrParams;
      limit = maybeParams?.limit;
      offset = maybeParams?.offset;
    } else if (groupIdOrParams) {
      groupId = (groupIdOrParams as { groupId: string }).groupId;
      limit = groupIdOrParams.limit;
      offset = groupIdOrParams.offset;
    }
  } else if (typeof clientOrGroupId === 'string') {
    client = getDefaultClient();
    groupId = clientOrGroupId;
    limit = (groupIdOrParams as PaginationParams)?.limit;
    offset = (groupIdOrParams as PaginationParams)?.offset;
  } else {
    client = clientOrGroupId.client ?? getDefaultClient();
    groupId = clientOrGroupId.groupId;
    limit = clientOrGroupId.limit;
    offset = clientOrGroupId.offset;
  }

  return client.request<LeaderboardEntry[]>(
    `/v1/leaderboard/group/${encodeURIComponent(groupId)}`,
    {
      method: 'GET',
      query: {
        limit,
        offset,
      },
    }
  );
}

export const groupLeaderboard = getGroupLeaderboard;

export class LeaderboardResource {
  constructor(private readonly client: QuickQuizClient) {}

  /**
   * Get the global top player leaderboard.
   */
  async global(params?: PaginationParams): Promise<LeaderboardEntry[]> {
    return getGlobalLeaderboard(this.client, params);
  }

  /**
   * Get the leaderboard for a specific group. Requires authentication and membership in the group.
   */
  async group(
    groupIdOrParams: string | ({ groupId: string } & PaginationParams),
    maybeParams?: PaginationParams
  ): Promise<LeaderboardEntry[]> {
    return getGroupLeaderboard(this.client, groupIdOrParams, maybeParams);
  }
}
