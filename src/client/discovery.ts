import { isClient, getDefaultClient, type ClientLike } from './http';
import type { QuickQuizClient } from './client';
import type { SearchResultPage, TopicInfo } from '../types';

export interface SearchOptions {
  limit?: number;
  offset?: number;
  page?: number;
  client?: ClientLike;
}

/**
 * Search for questions matching keywords.
 */
export async function searchQuestions(
  clientOrQuery: ClientLike | string | ({ query: string } & SearchOptions),
  queryOrOptions?: string | ({ query: string } & SearchOptions) | SearchOptions,
  maybeOptions?: SearchOptions
): Promise<SearchResultPage> {
  let client: ClientLike;
  let query = '';
  let limit: number | undefined;
  let offset: number | undefined;
  let page: number | undefined;

  if (isClient(clientOrQuery)) {
    client = clientOrQuery;
    if (typeof queryOrOptions === 'string') {
      query = queryOrOptions;
      limit = maybeOptions?.limit;
      offset = maybeOptions?.offset;
      page = maybeOptions?.page;
    } else if (queryOrOptions) {
      query = (queryOrOptions as { query: string }).query;
      limit = queryOrOptions.limit;
      offset = queryOrOptions.offset;
      page = queryOrOptions.page;
    }
  } else if (typeof clientOrQuery === 'string') {
    client = (queryOrOptions as SearchOptions)?.client ?? getDefaultClient();
    query = clientOrQuery;
    limit = (queryOrOptions as SearchOptions)?.limit;
    offset = (queryOrOptions as SearchOptions)?.offset;
    page = (queryOrOptions as SearchOptions)?.page;
  } else {
    client = clientOrQuery.client ?? getDefaultClient();
    query = clientOrQuery.query;
    limit = clientOrQuery.limit;
    offset = clientOrQuery.offset;
    page = clientOrQuery.page;
  }

  return client.request<SearchResultPage>('/v1/search', {
    method: 'GET',
    query: {
      q: query,
      limit,
      offset,
      page,
    },
  });
}

export const search = searchQuestions;

/**
 * List all question topics with count and recent activity.
 */
export async function getTopics(
  clientOrOptions?: ClientLike | { client?: ClientLike }
): Promise<TopicInfo[]> {
  const client = isClient(clientOrOptions)
    ? clientOrOptions
    : (clientOrOptions?.client ?? getDefaultClient());

  return client.request<TopicInfo[]>('/v1/topics', {
    method: 'GET',
  });
}

/**
 * Get questions filed under a specific topic/category.
 */
export async function getTopicQuestions(
  clientOrTopic: ClientLike | string | ({ topic: string } & SearchOptions),
  topicOrOptions?: string | ({ topic: string } & SearchOptions) | SearchOptions,
  maybeOptions?: SearchOptions
): Promise<SearchResultPage> {
  let client: ClientLike;
  let topic = '';
  let limit: number | undefined;
  let offset: number | undefined;
  let page: number | undefined;

  if (isClient(clientOrTopic)) {
    client = clientOrTopic;
    if (typeof topicOrOptions === 'string') {
      topic = topicOrOptions;
      limit = maybeOptions?.limit;
      offset = maybeOptions?.offset;
      page = maybeOptions?.page;
    } else if (topicOrOptions) {
      topic = (topicOrOptions as { topic: string }).topic;
      limit = topicOrOptions.limit;
      offset = topicOrOptions.offset;
      page = topicOrOptions.page;
    }
  } else if (typeof clientOrTopic === 'string') {
    client = (topicOrOptions as SearchOptions)?.client ?? getDefaultClient();
    topic = clientOrTopic;
    limit = (topicOrOptions as SearchOptions)?.limit;
    offset = (topicOrOptions as SearchOptions)?.offset;
    page = (topicOrOptions as SearchOptions)?.page;
  } else {
    client = clientOrTopic.client ?? getDefaultClient();
    topic = clientOrTopic.topic;
    limit = clientOrTopic.limit;
    offset = clientOrTopic.offset;
    page = clientOrTopic.page;
  }

  return client.request<SearchResultPage>(
    `/v1/topics/${encodeURIComponent(topic)}/questions`,
    {
      method: 'GET',
      query: {
        limit,
        offset,
        page,
      },
    }
  );
}

export class DiscoveryResource {
  constructor(private readonly client: QuickQuizClient) {}

  /**
   * Search for questions matching keywords.
   */
  async search(
    queryOrOptions: string | ({ query: string } & SearchOptions),
    maybeOptions?: SearchOptions
  ): Promise<SearchResultPage> {
    return searchQuestions(this.client, queryOrOptions, maybeOptions);
  }

  /**
   * List all question topics with count and recent activity.
   */
  async topics(): Promise<TopicInfo[]> {
    return getTopics(this.client);
  }

  /**
   * Get questions filed under a specific topic/category.
   */
  async topicQuestions(
    topicOrOptions: string | ({ topic: string } & SearchOptions),
    maybeOptions?: SearchOptions
  ): Promise<SearchResultPage> {
    return getTopicQuestions(this.client, topicOrOptions, maybeOptions);
  }
}
