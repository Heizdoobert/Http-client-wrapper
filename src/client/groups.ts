import { isClient, getDefaultClient, type ClientLike } from './http';
import type { QuickQuizClient } from './client';
import type { Group } from '../types';

/**
 * Create a new group. Requires authentication.
 */
export async function createGroup(
  clientOrName: ClientLike | string | { name: string; description?: string; client?: ClientLike },
  nameOrParams?: string | { name: string; description?: string },
  maybeDescription?: string
): Promise<Group> {
  let client: ClientLike;
  let payload: { name: string; description?: string };

  if (isClient(clientOrName)) {
    client = clientOrName;
    if (typeof nameOrParams === 'string') {
      payload = { name: nameOrParams, description: maybeDescription };
    } else {
      payload = nameOrParams ?? { name: '' };
    }
  } else if (typeof clientOrName === 'string') {
    client = getDefaultClient();
    payload = {
      name: clientOrName,
      description: typeof nameOrParams === 'string' ? nameOrParams : undefined,
    };
  } else {
    client = clientOrName.client ?? getDefaultClient();
    payload = { name: clientOrName.name, description: clientOrName.description };
  }

  return client.request<Group>('/v1/groups', {
    method: 'POST',
    body: payload,
  });
}

/**
 * List groups that the current user belongs to. Requires authentication.
 */
export async function listGroups(
  clientOrOptions?: ClientLike | { client?: ClientLike }
): Promise<Group[]> {
  const client = isClient(clientOrOptions)
    ? clientOrOptions
    : (clientOrOptions?.client ?? getDefaultClient());

  return client.request<Group[]>('/v1/groups', {
    method: 'GET',
  });
}

/**
 * Join an existing group by ID. Requires authentication.
 */
export async function joinGroup(
  clientOrGroupId: ClientLike | string | { groupId: string; client?: ClientLike },
  maybeGroupId?: string | { groupId: string }
): Promise<{ ok: boolean }> {
  let client: ClientLike;
  let groupId: string;

  if (isClient(clientOrGroupId)) {
    client = clientOrGroupId;
    groupId = typeof maybeGroupId === 'string' ? maybeGroupId : (maybeGroupId?.groupId ?? '');
  } else if (typeof clientOrGroupId === 'string') {
    client = getDefaultClient();
    groupId = clientOrGroupId;
  } else {
    client = clientOrGroupId.client ?? getDefaultClient();
    groupId = clientOrGroupId.groupId;
  }

  return client.request<{ ok: boolean }>(
    `/v1/groups/${encodeURIComponent(groupId)}/join`,
    {
      method: 'POST',
    }
  );
}

/**
 * Leave a group by ID. Requires authentication.
 */
export async function leaveGroup(
  clientOrGroupId: ClientLike | string | { groupId: string; client?: ClientLike },
  maybeGroupId?: string | { groupId: string }
): Promise<{ ok: boolean }> {
  let client: ClientLike;
  let groupId: string;

  if (isClient(clientOrGroupId)) {
    client = clientOrGroupId;
    groupId = typeof maybeGroupId === 'string' ? maybeGroupId : (maybeGroupId?.groupId ?? '');
  } else if (typeof clientOrGroupId === 'string') {
    client = getDefaultClient();
    groupId = clientOrGroupId;
  } else {
    client = clientOrGroupId.client ?? getDefaultClient();
    groupId = clientOrGroupId.groupId;
  }

  return client.request<{ ok: boolean }>(
    `/v1/groups/${encodeURIComponent(groupId)}/leave`,
    {
      method: 'POST',
    }
  );
}

export class GroupsResource {
  constructor(private readonly client: QuickQuizClient) {}

  /**
   * Create a new group. Requires authentication.
   */
  async create(
    nameOrParams: string | { name: string; description?: string },
    maybeDescription?: string
  ): Promise<Group> {
    return createGroup(this.client, nameOrParams, maybeDescription);
  }

  /**
   * List groups that the current user belongs to. Requires authentication.
   */
  async list(): Promise<Group[]> {
    return listGroups(this.client);
  }

  /**
   * Join an existing group by ID. Requires authentication.
   */
  async join(groupIdOrParams: string | { groupId: string }): Promise<{ ok: boolean }> {
    return joinGroup(this.client, groupIdOrParams);
  }

  /**
   * Leave a group by ID. Requires authentication.
   */
  async leave(groupIdOrParams: string | { groupId: string }): Promise<{ ok: boolean }> {
    return leaveGroup(this.client, groupIdOrParams);
  }
}
