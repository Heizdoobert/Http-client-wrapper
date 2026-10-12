import { isClient, getDefaultClient, type ClientLike } from './http';
import type { QuickQuizClient } from './client';
import type { ClientQuestion, CreateQuestionInput, GeneratedQuestion } from './types';

export interface RandomQuestionOptions {
  category?: string;
  exclude?: string[] | string;
  client?: ClientLike;
}

/**
 * Fetch a random question, optionally filtering by category and excluding question IDs.
 */
export async function getRandomQuestion(
  clientOrOptions?: ClientLike | RandomQuestionOptions,
  maybeOptions?: Omit<RandomQuestionOptions, 'client'>
): Promise<ClientQuestion | null> {
  let client: ClientLike;
  let options: RandomQuestionOptions | undefined;

  if (isClient(clientOrOptions)) {
    client = clientOrOptions;
    options = maybeOptions;
  } else {
    options = clientOrOptions;
    client = options?.client ?? getDefaultClient();
  }

  return client.request<ClientQuestion | null>('/v1/questions/random', {
    method: 'GET',
    query: {
      category: options?.category,
      exclude: Array.isArray(options?.exclude) ? options.exclude.join(',') : options?.exclude,
    },
  });
}

export const randomQuestion = getRandomQuestion;

/**
 * Retrieve a specific public question by ID.
 */
export async function getQuestionById(
  clientOrId: ClientLike | string,
  maybeId?: string
): Promise<ClientQuestion> {
  let client: ClientLike;
  let id: string;

  if (isClient(clientOrId)) {
    client = clientOrId;
    id = maybeId ?? '';
  } else {
    client = getDefaultClient();
    id = clientOrId;
  }

  return client.request<ClientQuestion>(`/v1/questions/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
}

export const getQuestion = getQuestionById;

/**
 * Get the total count of verified questions available in the system.
 */
export async function getQuestionCount(
  clientOrOptions?: ClientLike | { client?: ClientLike }
): Promise<{ count: number }> {
  const client = isClient(clientOrOptions)
    ? clientOrOptions
    : (clientOrOptions?.client ?? getDefaultClient());

  return client.request<{ count: number }>('/v1/questions/count', {
    method: 'GET',
  });
}

export const countQuestions = getQuestionCount;

/**
 * Create a new question. Requires authentication.
 */
export async function createQuestion(
  clientOrData: ClientLike | CreateQuestionInput,
  maybeData?: CreateQuestionInput
): Promise<void> {
  let client: ClientLike;
  let data: CreateQuestionInput;

  if (isClient(clientOrData)) {
    client = clientOrData;
    data = maybeData!;
  } else {
    client = getDefaultClient();
    data = clientOrData;
  }

  return client.request<void>('/v1/questions', {
    method: 'POST',
    body: data,
  });
}

/**
 * Generate a question on a given topic using AI. Requires authentication.
 */
export async function generateQuestion(
  clientOrTopic: ClientLike | string | { topic: string; client?: ClientLike },
  maybeTopic?: string | { topic: string }
): Promise<GeneratedQuestion> {
  let client: ClientLike;
  let payload: { topic: string };

  if (isClient(clientOrTopic)) {
    client = clientOrTopic;
    payload = typeof maybeTopic === 'string' ? { topic: maybeTopic } : (maybeTopic ?? { topic: '' });
  } else if (typeof clientOrTopic === 'string') {
    client = getDefaultClient();
    payload = { topic: clientOrTopic };
  } else {
    client = clientOrTopic?.client ?? getDefaultClient();
    payload = { topic: clientOrTopic.topic };
  }

  return client.request<GeneratedQuestion>('/v1/questions/generate', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Dispute/report a question. Requires authentication.
 */
export async function disputeQuestion(
  clientOrId: ClientLike | string | { questionId: string; reason: string; client?: ClientLike },
  idOrParams?: string | { questionId: string; reason: string } | { reason: string },
  maybeReason?: string | { reason: string }
): Promise<{ quarantined: boolean }> {
  let client: ClientLike;
  let id = '';
  let reason = '';

  if (isClient(clientOrId)) {
    client = clientOrId;
    if (typeof idOrParams === 'string') {
      id = idOrParams;
      reason = typeof maybeReason === 'string' ? maybeReason : (maybeReason?.reason ?? '');
    } else if (idOrParams && 'questionId' in idOrParams) {
      id = idOrParams.questionId;
      reason = idOrParams.reason;
    }
  } else if (typeof clientOrId === 'string') {
    client = getDefaultClient();
    id = clientOrId;
    reason =
      typeof idOrParams === 'string'
        ? idOrParams
        : (idOrParams && 'reason' in idOrParams ? idOrParams.reason : '');
  } else {
    client = clientOrId.client ?? getDefaultClient();
    id = clientOrId.questionId;
    reason = clientOrId.reason;
  }

  return client.request<{ quarantined: boolean }>(
    `/v1/questions/${encodeURIComponent(id)}/dispute`,
    {
      method: 'POST',
      body: { reason },
    }
  );
}

/**
 * Retrieve the 50/50 lifeline eliminated answer indices for a question. Requires authentication.
 */
export async function get5050EliminatedIndices(
  clientOrId: ClientLike | string,
  maybeId?: string
): Promise<number[]> {
  let client: ClientLike;
  let id: string;

  if (isClient(clientOrId)) {
    client = clientOrId;
    id = maybeId ?? '';
  } else {
    client = getDefaultClient();
    id = clientOrId;
  }

  return client.request<number[]>(`/v1/questions/${encodeURIComponent(id)}/5050`, {
    method: 'GET',
  });
}

export const fiftyFifty = get5050EliminatedIndices;

export class QuestionsResource {
  constructor(private readonly client: QuickQuizClient) {}

  /**
   * Fetch a random question, optionally filtering by category and excluding question IDs.
   */
  async random(options?: {
    category?: string;
    exclude?: string[] | string;
  }): Promise<ClientQuestion | null> {
    return getRandomQuestion(this.client, options);
  }

  /**
   * Retrieve a specific public question by ID.
   */
  async get(id: string): Promise<ClientQuestion> {
    return getQuestionById(this.client, id);
  }

  /**
   * Get the total count of verified questions available in the system.
   */
  async count(): Promise<{ count: number }> {
    return getQuestionCount(this.client);
  }

  /**
   * Create a new question. Requires authentication.
   */
  async create(data: CreateQuestionInput): Promise<void> {
    return createQuestion(this.client, data);
  }

  /**
   * Generate a question on a given topic using AI. Requires authentication.
   */
  async generate(topicOrParams: string | { topic: string }): Promise<GeneratedQuestion> {
    return generateQuestion(this.client, topicOrParams);
  }

  /**
   * Dispute/report a question. Requires authentication.
   */
  async dispute(
    idOrParams: string | { questionId: string; reason: string },
    maybeReason?: string | { reason: string }
  ): Promise<{ quarantined: boolean }> {
    return disputeQuestion(this.client, idOrParams, maybeReason);
  }

  /**
   * Retrieve the 50/50 lifeline eliminated answer indices for a question. Requires authentication.
   */
  async fiftyFifty(id: string): Promise<number[]> {
    return get5050EliminatedIndices(this.client, id);
  }
}
