import { isClient, getDefaultClient, type ClientLike } from './http';
import type { QuickQuizClient } from './client';
import type { AnswerSubmissionResult, HistoryItem, UserStats } from '../types';

/**
 * Submit an answer to a question. Requires authentication.
 */
export async function submitQuizAnswer(
  clientOrQuestion: ClientLike | string | { questionId: string; answerIndex: number; client?: ClientLike },
  questionIdOrParams?: string | { questionId: string; answerIndex: number } | number,
  maybeAnswerIndex?: number
): Promise<AnswerSubmissionResult> {
  let client: ClientLike;
  let payload: { questionId: string; answerIndex: number };

  if (isClient(clientOrQuestion)) {
    client = clientOrQuestion;
    if (typeof questionIdOrParams === 'string') {
      payload = { questionId: questionIdOrParams, answerIndex: maybeAnswerIndex ?? 0 };
    } else {
      payload = questionIdOrParams as { questionId: string; answerIndex: number };
    }
  } else if (typeof clientOrQuestion === 'string') {
    client = getDefaultClient();
    payload = {
      questionId: clientOrQuestion,
      answerIndex: typeof questionIdOrParams === 'number' ? questionIdOrParams : (maybeAnswerIndex ?? 0),
    };
  } else {
    client = clientOrQuestion.client ?? getDefaultClient();
    payload = { questionId: clientOrQuestion.questionId, answerIndex: clientOrQuestion.answerIndex };
  }

  return client.request<AnswerSubmissionResult>('/v1/quiz/answer', {
    method: 'POST',
    body: payload,
  });
}

export const submitAnswer = submitQuizAnswer;

/**
 * Get recent answered questions history for the current user. Requires authentication.
 */
export async function getAnswerHistory(
  clientOrOptions?: ClientLike | { client?: ClientLike }
): Promise<HistoryItem[]> {
  const client = isClient(clientOrOptions)
    ? clientOrOptions
    : (clientOrOptions?.client ?? getDefaultClient());

  return client.request<HistoryItem[]>('/v1/quiz/history', {
    method: 'GET',
  });
}

export const getQuizHistory = getAnswerHistory;

/**
 * Get stats for the current user (score, streaks, accuracy, total answered). Requires authentication.
 */
export async function getUserStats(
  clientOrOptions?: ClientLike | { client?: ClientLike }
): Promise<UserStats> {
  const client = isClient(clientOrOptions)
    ? clientOrOptions
    : (clientOrOptions?.client ?? getDefaultClient());

  return client.request<UserStats>('/v1/quiz/stats', {
    method: 'GET',
  });
}

export const getQuizStats = getUserStats;

export class QuizResource {
  constructor(private readonly client: QuickQuizClient) {}

  /**
   * Submit an answer to a question. Requires authentication.
   */
  async submitAnswer(
    questionIdOrParams: string | { questionId: string; answerIndex: number },
    maybeAnswerIndex?: number
  ): Promise<AnswerSubmissionResult> {
    return submitQuizAnswer(this.client, questionIdOrParams, maybeAnswerIndex);
  }

  /**
   * Get recent answered questions history for the current user. Requires authentication.
   */
  async history(): Promise<HistoryItem[]> {
    return getAnswerHistory(this.client);
  }

  /**
   * Get stats for the current user (score, streaks, accuracy, total answered). Requires authentication.
   */
  async stats(): Promise<UserStats> {
    return getUserStats(this.client);
  }
}
