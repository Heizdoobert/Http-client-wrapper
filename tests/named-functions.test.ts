import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  QuickQuizClient,
  createClient,
  setDefaultClient,
  getDefaultClient,
  // Auth
  signUp,
  signIn,
  signInWithGoogle,
  requestEmailCode,
  verifyEmailCode,
  getSession,
  session,
  signOut,
  // Questions
  getRandomQuestion,
  randomQuestion,
  getQuestionById,
  getQuestion,
  getQuestionCount,
  countQuestions,
  createQuestion,
  generateQuestion,
  disputeQuestion,
  get5050EliminatedIndices,
  fiftyFifty,
  // Quiz
  submitQuizAnswer,
  submitAnswer,
  getAnswerHistory,
  getQuizHistory,
  getUserStats,
  getQuizStats,
  // Leaderboard
  getGlobalLeaderboard,
  globalLeaderboard,
  getGroupLeaderboard,
  groupLeaderboard,
  // Groups
  createGroup,
  listGroups,
  joinGroup,
  leaveGroup,
  // Community
  rateQuestion,
  addComment,
  commentQuestion,
  deleteComment,
  resolveSuggestion,
  getQuestionDiscussion,
  getDiscussion,
  getSuggestions,
  // Discovery
  searchQuestions,
  search,
  getTopics,
  getTopicQuestions,
  // Profile
  getUserQuizzes,
  exportUserData,
  exportProfileData,
  getQuestionAnalytics,
} from '../src';

describe('SDK Standalone Named Functions', () => {
  const baseUrl = 'https://api.quickquiz.app';
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: QuickQuizClient;

  function mockResponse(data: unknown, status = 200) {
    mockFetch.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify({ success: true, data }),
    });
  }

  beforeEach(() => {
    mockFetch = vi.fn();
    client = createClient({
      baseUrl,
      fetch: mockFetch as unknown as typeof fetch,
    });
    setDefaultClient(client);
  });

  describe('Client Management and Factory', () => {
    it('createClient returns a QuickQuizClient instance', () => {
      expect(client).toBeInstanceOf(QuickQuizClient);
    });

    it('setDefaultClient and getDefaultClient work properly', () => {
      setDefaultClient(client);
      expect(getDefaultClient()).toBe(client);
    });
  });

  describe('Auth Named Functions', () => {
    it('signUp: with client and positional args', async () => {
      mockResponse({ token: 'jwt-1', accountId: 'acc-1' });
      const res = await signUp(client, 'user1', 'pass1');
      expect(res).toEqual({ token: 'jwt-1', accountId: 'acc-1' });
      expect(client.getToken()).toBe('jwt-1');
    });

    it('signUp: with default client', async () => {
      mockResponse({ token: 'jwt-def', accountId: 'acc-def' });
      const res = await signUp('user_def', 'pass_def');
      expect(res).toEqual({ token: 'jwt-def', accountId: 'acc-def' });
      expect(client.getToken()).toBe('jwt-def');
    });

    it('signIn: with client and object args', async () => {
      mockResponse({ token: 'jwt-2', accountId: 'acc-2' });
      const res = await signIn(client, { username: 'user2', password: 'pass2' });
      expect(res).toEqual({ token: 'jwt-2', accountId: 'acc-2' });
      expect(client.getToken()).toBe('jwt-2');
    });

    it('signInWithGoogle: updates token', async () => {
      mockResponse({ token: 'jwt-g', accountId: 'acc-g' });
      const res = await signInWithGoogle(client, 'google-tok');
      expect(res).toEqual({ token: 'jwt-g', accountId: 'acc-g' });
      expect(client.getToken()).toBe('jwt-g');
    });

    it('requestEmailCode: calls request endpoint', async () => {
      mockResponse({ sent: true });
      const res = await requestEmailCode(client, 'a@b.com');
      expect(res).toEqual({ sent: true });
    });

    it('verifyEmailCode: updates token', async () => {
      mockResponse({ ok: true, token: 'email-tok', accountId: 'acc-e' });
      const res = await verifyEmailCode(client, 'a@b.com', '123456');
      expect(res).toEqual({ ok: true, token: 'email-tok', accountId: 'acc-e' });
      expect(client.getToken()).toBe('email-tok');
    });

    it('getSession and session alias: retrieves session', async () => {
      client.setToken('auth-session-tok');
      mockResponse({ id: 'acc-sess', username: 'alice' });
      const res1 = await getSession(client);
      expect(res1).toEqual({ id: 'acc-sess', username: 'alice' });

      mockResponse({ id: 'acc-sess', username: 'alice' });
      const res2 = await session(client);
      expect(res2).toEqual({ id: 'acc-sess', username: 'alice' });
    });

    it('signOut: clears token on client', async () => {
      client.setToken('tok-out');
      mockResponse({ ok: true });
      const res = await signOut(client);
      expect(res).toEqual({ ok: true });
      expect(client.getToken()).toBeNull();
    });
  });

  describe('Questions Named Functions', () => {
    it('getRandomQuestion and randomQuestion alias', async () => {
      const q = { id: 'q-1', prompt: 'P1', options: ['A', 'B'], category: 'Tech' };
      mockResponse(q);
      const res1 = await getRandomQuestion(client, { category: 'Tech' });
      expect(res1).toEqual(q);

      mockResponse(q);
      const res2 = await randomQuestion({ category: 'Tech' }); // default client
      expect(res2).toEqual(q);
    });

    it('getQuestionById and getQuestion alias', async () => {
      const q = { id: 'q-2', prompt: 'P2', options: ['A', 'B'] };
      mockResponse(q);
      const res1 = await getQuestionById(client, 'q-2');
      expect(res1).toEqual(q);

      mockResponse(q);
      const res2 = await getQuestion('q-2');
      expect(res2).toEqual(q);
    });

    it('getQuestionCount and countQuestions alias', async () => {
      mockResponse({ count: 50 });
      const res1 = await getQuestionCount(client);
      expect(res1).toEqual({ count: 50 });

      mockResponse({ count: 50 });
      const res2 = await countQuestions();
      expect(res2).toEqual({ count: 50 });
    });

    it('createQuestion: creates question with client', async () => {
      mockResponse(undefined);
      await createQuestion(client, {
        prompt: 'Q?',
        options: ['1', '2', '3', '4'],
        correctIndex: 0,
        category: 'General',
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('generateQuestion: calls generator endpoint', async () => {
      const generated = {
        prompt: 'Gen?',
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 1,
        explanation: 'Exp',
      };
      mockResponse(generated);
      const res = await generateQuestion(client, 'Science');
      expect(res).toEqual(generated);
    });

    it('disputeQuestion: reports dispute', async () => {
      mockResponse({ quarantined: true });
      const res = await disputeQuestion(client, 'q-1', 'bad prompt');
      expect(res).toEqual({ quarantined: true });
    });

    it('get5050EliminatedIndices and fiftyFifty alias', async () => {
      mockResponse([1, 3]);
      const res1 = await get5050EliminatedIndices(client, 'q-1');
      expect(res1).toEqual([1, 3]);

      mockResponse([1, 3]);
      const res2 = await fiftyFifty('q-1');
      expect(res2).toEqual([1, 3]);
    });
  });

  describe('Quiz Named Functions', () => {
    it('submitQuizAnswer and submitAnswer alias', async () => {
      const result = { isCorrect: true, correctIndex: 2, recorded: true, explanation: 'Good job' };
      mockResponse(result);
      const res1 = await submitQuizAnswer(client, 'q-10', 2);
      expect(res1).toEqual(result);

      mockResponse(result);
      const res2 = await submitAnswer('q-10', 2);
      expect(res2).toEqual(result);
    });

    it('getAnswerHistory and getQuizHistory alias', async () => {
      const history = [{ questionId: 'q-1', prompt: 'P', isCorrect: true }];
      mockResponse(history);
      const res1 = await getAnswerHistory(client);
      expect(res1).toEqual(history);

      mockResponse(history);
      const res2 = await getQuizHistory();
      expect(res2).toEqual(history);
    });

    it('getUserStats and getQuizStats alias', async () => {
      const stats = { score: 10, streak: 2, bestStreak: 5, accuracy: 80, totalAnswered: 15 };
      mockResponse(stats);
      const res1 = await getUserStats(client);
      expect(res1).toEqual(stats);

      mockResponse(stats);
      const res2 = await getQuizStats();
      expect(res2).toEqual(stats);
    });
  });

  describe('Leaderboard Named Functions', () => {
    it('getGlobalLeaderboard and globalLeaderboard alias', async () => {
      const leaders = [{ user_id: 'u-1', display_name: 'P1', score: 100, accuracy: 90, rank: 1 }];
      mockResponse(leaders);
      const res1 = await getGlobalLeaderboard(client, { limit: 5 });
      expect(res1).toEqual(leaders);

      mockResponse(leaders);
      const res2 = await globalLeaderboard({ limit: 5 });
      expect(res2).toEqual(leaders);
    });

    it('getGroupLeaderboard and groupLeaderboard alias', async () => {
      const leaders = [{ user_id: 'u-2', display_name: 'P2', score: 80, accuracy: 80, rank: 1 }];
      mockResponse(leaders);
      const res1 = await getGroupLeaderboard(client, 'grp-1', { limit: 10 });
      expect(res1).toEqual(leaders);

      mockResponse(leaders);
      const res2 = await groupLeaderboard('grp-1', { limit: 10 });
      expect(res2).toEqual(leaders);
    });
  });

  describe('Groups Named Functions', () => {
    it('createGroup, listGroups, joinGroup, leaveGroup', async () => {
      const grp = { id: 'g-1', name: 'G1', description: 'Desc', created_at: '2026-10-12' };
      mockResponse(grp);
      const created = await createGroup(client, 'G1', 'Desc');
      expect(created).toEqual(grp);

      mockResponse([grp]);
      const list = await listGroups(client);
      expect(list).toEqual([grp]);

      mockResponse({ ok: true });
      const joined = await joinGroup(client, 'g-1');
      expect(joined).toEqual({ ok: true });

      mockResponse({ ok: true });
      const left = await leaveGroup(client, 'g-1');
      expect(left).toEqual({ ok: true });
    });
  });

  describe('Community Named Functions', () => {
    it('rateQuestion, addComment, deleteComment, resolveSuggestion', async () => {
      mockResponse({ ok: true });
      expect(await rateQuestion(client, 'q-1', 5)).toEqual({ ok: true });

      mockResponse({ ok: true });
      expect(await addComment(client, 'q-1', 'Great!', 'comment')).toEqual({ ok: true });

      mockResponse({ ok: true });
      expect(await commentQuestion('q-1', 'Great! feedback')).toEqual({ ok: true });

      mockResponse({ ok: true });
      expect(await deleteComment(client, 'c-1')).toEqual({ ok: true });

      mockResponse({ ok: true });
      expect(await resolveSuggestion(client, 's-1')).toEqual({ ok: true });
    });

    it('getQuestionDiscussion, getDiscussion alias, and getSuggestions', async () => {
      const discussion = {
        rating: { average: 5, count: 1 },
        myRating: 5,
        comments: [],
        hasMore: false,
      };
      mockResponse(discussion);
      expect(await getQuestionDiscussion(client, 'q-1', { page: 1 })).toEqual(discussion);

      mockResponse(discussion);
      expect(await getDiscussion('q-1', { page: 1 })).toEqual(discussion);

      const suggestions = [{ id: 's-1', questionId: 'q-1', questionPrompt: 'Q', body: 'Fix', senderName: 'Sam', createdAt: '2026-10-12', resolvedAt: null }];
      mockResponse(suggestions);
      expect(await getSuggestions(client)).toEqual(suggestions);
    });
  });

  describe('Discovery Named Functions', () => {
    it('searchQuestions, search alias, getTopics, getTopicQuestions', async () => {
      const results = { results: [], hasMore: false };
      mockResponse(results);
      expect(await searchQuestions(client, 'bio', { limit: 10 })).toEqual(results);

      mockResponse(results);
      expect(await search('bio', { limit: 10 })).toEqual(results);

      const topics = [{ name: 'Tech', questionCount: 10, latestAt: '2026-10-12' }];
      mockResponse(topics);
      expect(await getTopics(client)).toEqual(topics);

      mockResponse(results);
      expect(await getTopicQuestions(client, 'Tech', { page: 1 })).toEqual(results);
    });
  });

  describe('Profile Named Functions', () => {
    it('getUserQuizzes, exportUserData, exportProfileData alias, getQuestionAnalytics', async () => {
      const userQuizzes = { quizzes: [], count: 0 };
      mockResponse(userQuizzes);
      expect(await getUserQuizzes(client, { limit: 5 })).toEqual(userQuizzes);

      const backup = { accountId: 'u-1', exportedAt: '2026-10-12', version: '1.0', quizzes: [], stats: [] };
      mockResponse(backup);
      expect(await exportUserData(client)).toEqual(backup);

      mockResponse(backup);
      expect(await exportProfileData()).toEqual(backup);

      const analytics = [{ question_id: 'q-1', prompt: 'P', play_count: 10, accuracy_rate: 0.9 }];
      mockResponse(analytics);
      expect(await getQuestionAnalytics(client)).toEqual(analytics);
    });
  });
});
