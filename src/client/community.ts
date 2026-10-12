import { isClient, getDefaultClient, type ClientLike } from './http';
import type { QuickQuizClient } from './client';
import type { DiscussionView, SuggestionView } from '../types';

/**
 * Submit a 1-5 star rating for a question. Requires authentication and prior answer.
 */
export async function rateQuestion(
  clientOrQuestionId: ClientLike | string | { questionId: string; rating: number; client?: ClientLike },
  questionIdOrParams?: string | { questionId: string; rating: number } | number,
  maybeRating?: number
): Promise<{ ok: boolean }> {
  let client: ClientLike;
  let questionId = '';
  let rating = 0;

  if (isClient(clientOrQuestionId)) {
    client = clientOrQuestionId;
    if (typeof questionIdOrParams === 'string') {
      questionId = questionIdOrParams;
      rating = maybeRating ?? 0;
    } else if (questionIdOrParams) {
      questionId = (questionIdOrParams as { questionId: string }).questionId;
      rating = (questionIdOrParams as { rating: number }).rating;
    }
  } else if (typeof clientOrQuestionId === 'string') {
    client = getDefaultClient();
    questionId = clientOrQuestionId;
    rating = typeof questionIdOrParams === 'number' ? questionIdOrParams : (maybeRating ?? 0);
  } else {
    client = clientOrQuestionId.client ?? getDefaultClient();
    questionId = clientOrQuestionId.questionId;
    rating = clientOrQuestionId.rating;
  }

  return client.request<{ ok: boolean }>(
    `/v1/questions/${encodeURIComponent(questionId)}/rate`,
    {
      method: 'POST',
      body: { rating },
    }
  );
}

/**
 * Post a comment or suggestion on a question. Requires authentication and prior answer.
 */
export async function addComment(
  clientOrQuestionId:
    | ClientLike
    | string
    | { questionId: string; body: string; kind?: 'comment' | 'suggestion'; client?: ClientLike },
  questionIdOrParams?:
    | string
    | { questionId: string; body: string; kind?: 'comment' | 'suggestion' },
  maybeBody?: string,
  maybeKind?: 'comment' | 'suggestion'
): Promise<{ ok: boolean }> {
  let client: ClientLike;
  let questionId = '';
  let body = '';
  let kind: 'comment' | 'suggestion' = 'comment';

  if (isClient(clientOrQuestionId)) {
    client = clientOrQuestionId;
    if (typeof questionIdOrParams === 'string') {
      questionId = questionIdOrParams;
      body = maybeBody ?? '';
      if (maybeKind) {
        kind = maybeKind;
      }
    } else if (questionIdOrParams) {
      questionId = questionIdOrParams.questionId;
      body = questionIdOrParams.body;
      if (questionIdOrParams.kind) {
        kind = questionIdOrParams.kind;
      }
    }
  } else if (typeof clientOrQuestionId === 'string') {
    client = getDefaultClient();
    questionId = clientOrQuestionId;
    body = typeof questionIdOrParams === 'string' ? questionIdOrParams : '';
    if (maybeBody === 'comment' || maybeBody === 'suggestion') {
      kind = maybeBody;
    }
  } else {
    client = clientOrQuestionId.client ?? getDefaultClient();
    questionId = clientOrQuestionId.questionId;
    body = clientOrQuestionId.body;
    if (clientOrQuestionId.kind) {
      kind = clientOrQuestionId.kind;
    }
  }

  return client.request<{ ok: boolean }>(
    `/v1/questions/${encodeURIComponent(questionId)}/comment`,
    {
      method: 'POST',
      body: { body, kind },
    }
  );
}

export const commentQuestion = addComment;

/**
 * Delete a comment authored by the current user. Requires authentication.
 */
export async function deleteComment(
  clientOrCommentId: ClientLike | string | { commentId: string; client?: ClientLike },
  maybeCommentId?: string | { commentId: string }
): Promise<{ ok: boolean }> {
  let client: ClientLike;
  let commentId: string;

  if (isClient(clientOrCommentId)) {
    client = clientOrCommentId;
    commentId =
      typeof maybeCommentId === 'string'
        ? maybeCommentId
        : (maybeCommentId?.commentId ?? '');
  } else if (typeof clientOrCommentId === 'string') {
    client = getDefaultClient();
    commentId = clientOrCommentId;
  } else {
    client = clientOrCommentId.client ?? getDefaultClient();
    commentId = clientOrCommentId.commentId;
  }

  return client.request<{ ok: boolean }>(
    `/v1/comments/${encodeURIComponent(commentId)}`,
    {
      method: 'DELETE',
    }
  );
}

/**
 * Mark a question suggestion as resolved. Requires authentication and question authorship.
 */
export async function resolveSuggestion(
  clientOrSuggestionId: ClientLike | string | { suggestionId: string; client?: ClientLike },
  maybeSuggestionId?: string | { suggestionId: string }
): Promise<{ ok: boolean }> {
  let client: ClientLike;
  let suggestionId: string;

  if (isClient(clientOrSuggestionId)) {
    client = clientOrSuggestionId;
    suggestionId =
      typeof maybeSuggestionId === 'string'
        ? maybeSuggestionId
        : (maybeSuggestionId?.suggestionId ?? '');
  } else if (typeof clientOrSuggestionId === 'string') {
    client = getDefaultClient();
    suggestionId = clientOrSuggestionId;
  } else {
    client = clientOrSuggestionId.client ?? getDefaultClient();
    suggestionId = clientOrSuggestionId.suggestionId;
  }

  return client.request<{ ok: boolean }>(
    `/v1/suggestions/${encodeURIComponent(suggestionId)}/resolve`,
    {
      method: 'POST',
    }
  );
}

/**
 * Get ratings and comments discussion for a question.
 */
export async function getQuestionDiscussion(
  clientOrQuestionId: ClientLike | string | { questionId: string; page?: number; client?: ClientLike },
  questionIdOrParams?: string | { questionId: string; page?: number } | { page?: number },
  maybeOptions?: { page?: number }
): Promise<DiscussionView> {
  let client: ClientLike;
  let questionId = '';
  let page: number | undefined;

  if (isClient(clientOrQuestionId)) {
    client = clientOrQuestionId;
    if (typeof questionIdOrParams === 'string') {
      questionId = questionIdOrParams;
      page = maybeOptions?.page;
    } else if (questionIdOrParams) {
      questionId = (questionIdOrParams as { questionId: string }).questionId;
      page = (questionIdOrParams as { page?: number }).page;
    }
  } else if (typeof clientOrQuestionId === 'string') {
    client = getDefaultClient();
    questionId = clientOrQuestionId;
    page = (questionIdOrParams as { page?: number })?.page;
  } else {
    client = clientOrQuestionId.client ?? getDefaultClient();
    questionId = clientOrQuestionId.questionId;
    page = clientOrQuestionId.page;
  }

  return client.request<DiscussionView>(
    `/v1/questions/${encodeURIComponent(questionId)}/discussion`,
    {
      method: 'GET',
      query: { page },
    }
  );
}

export const getDiscussion = getQuestionDiscussion;

/**
 * Get pending suggestions on questions authored by the current user. Requires authentication.
 */
export async function getSuggestions(
  clientOrOptions?: ClientLike | { client?: ClientLike }
): Promise<SuggestionView[]> {
  const client = isClient(clientOrOptions)
    ? clientOrOptions
    : (clientOrOptions?.client ?? getDefaultClient());

  return client.request<SuggestionView[]>('/v1/suggestions', {
    method: 'GET',
  });
}

export class CommunityResource {
  constructor(private readonly client: QuickQuizClient) {}

  /**
   * Submit a 1-5 star rating for a question. Requires authentication and prior answer.
   */
  async rate(
    questionIdOrParams: string | { questionId: string; rating: number },
    maybeRating?: number
  ): Promise<{ ok: boolean }> {
    return rateQuestion(this.client, questionIdOrParams, maybeRating);
  }

  /**
   * Post a comment or suggestion on a question. Requires authentication and prior answer.
   */
  async comment(
    questionIdOrParams:
      | string
      | { questionId: string; body: string; kind?: 'comment' | 'suggestion' },
    maybeBody?: string,
    maybeKind?: 'comment' | 'suggestion'
  ): Promise<{ ok: boolean }> {
    return addComment(this.client, questionIdOrParams, maybeBody, maybeKind);
  }

  /**
   * Delete a comment authored by the current user. Requires authentication.
   */
  async deleteComment(
    commentIdOrParams: string | { commentId: string }
  ): Promise<{ ok: boolean }> {
    return deleteComment(this.client, commentIdOrParams);
  }

  /**
   * Mark a question suggestion as resolved. Requires authentication and question authorship.
   */
  async resolveSuggestion(
    suggestionIdOrParams: string | { suggestionId: string }
  ): Promise<{ ok: boolean }> {
    return resolveSuggestion(this.client, suggestionIdOrParams);
  }

  /**
   * Get ratings and comments discussion for a question.
   */
  async discussion(
    questionIdOrParams: string | { questionId: string; page?: number },
    maybeOptions?: { page?: number }
  ): Promise<DiscussionView> {
    return getQuestionDiscussion(this.client, questionIdOrParams, maybeOptions);
  }

  /**
   * Get pending suggestions on questions authored by the current user. Requires authentication.
   */
  async suggestions(): Promise<SuggestionView[]> {
    return getSuggestions(this.client);
  }
}
