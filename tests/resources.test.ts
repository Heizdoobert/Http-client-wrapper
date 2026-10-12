import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  QuickQuizClient,
  AuthResource,
  QuestionsResource,
  QuizResource,
  LeaderboardResource,
  CommunityResource,
  GroupsResource,
  DiscoveryResource,
  ProfileResource,
} from '../src';

describe('SDK Resource Modules', () => {
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
    client = new QuickQuizClient({
      baseUrl,
      fetch: mockFetch as unknown as typeof fetch,
    });
  });

  describe('QuickQuizClient resource wiring & exports', () => {
    it('instantiates and exposes all 8 resources', () => {
      expect(client.auth).toBeInstanceOf(AuthResource);
      expect(client.questions).toBeInstanceOf(QuestionsResource);
      expect(client.quiz).toBeInstanceOf(QuizResource);
      expect(client.leaderboard).toBeInstanceOf(LeaderboardResource);
      expect(client.community).toBeInstanceOf(CommunityResource);
      expect(client.groups).toBeInstanceOf(GroupsResource);
      expect(client.discovery).toBeInstanceOf(DiscoveryResource);
      expect(client.profile).toBeInstanceOf(ProfileResource);
    });
  });

  describe('AuthResource', () => {
    it('signUp: calls POST /v1/auth/signup, updates token, and returns data', async () => {
      mockResponse({ token: 'new-jwt-token', accountId: 'acc-123' });

      const res = await client.auth.signUp('alice', 'password123');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/auth/signup');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(init?.body as string)).toEqual({ username: 'alice', password: 'password123' });
      expect(res).toEqual({ token: 'new-jwt-token', accountId: 'acc-123' });
      expect(client.getToken()).toBe('new-jwt-token');
    });

    it('signUp with object parameter: updates token', async () => {
      mockResponse({ token: 'obj-token', accountId: 'acc-456' });

      const res = await client.auth.signUp({ username: 'bob', password: 'secretpassword' });

      expect(res).toEqual({ token: 'obj-token', accountId: 'acc-456' });
      expect(client.getToken()).toBe('obj-token');
    });

    it('signIn: calls POST /v1/auth/signin, updates token, and returns data', async () => {
      mockResponse({ token: 'signin-jwt-token', accountId: 'acc-123' });

      const res = await client.auth.signIn('alice', 'password123');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/auth/signin');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(init?.body as string)).toEqual({ username: 'alice', password: 'password123' });
      expect(res).toEqual({ token: 'signin-jwt-token', accountId: 'acc-123' });
      expect(client.getToken()).toBe('signin-jwt-token');
    });

    it('signIn with object parameter: updates token', async () => {
      mockResponse({ token: 'signin-obj-token', accountId: 'acc-789' });

      const res = await client.auth.signIn({ username: 'charlie', password: 'mypassword' });

      expect(res).toEqual({ token: 'signin-obj-token', accountId: 'acc-789' });
      expect(client.getToken()).toBe('signin-obj-token');
    });

    it('signInWithGoogle: calls POST /v1/auth/signin/google and updates token', async () => {
      mockResponse({ token: 'google-jwt-token', accountId: 'acc-google' });

      const res = await client.auth.signInWithGoogle('google-id-token-abc');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/auth/signin/google');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(init?.body as string)).toEqual({ idToken: 'google-id-token-abc' });
      expect(res).toEqual({ token: 'google-jwt-token', accountId: 'acc-google' });
      expect(client.getToken()).toBe('google-jwt-token');
    });

    it('requestEmailCode: calls POST /v1/auth/email/request and does not change token', async () => {
      mockResponse({ sent: true });

      const res = await client.auth.requestEmailCode('user@example.com');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/auth/email/request');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(init?.body as string)).toEqual({ email: 'user@example.com' });
      expect(res).toEqual({ sent: true });
      expect(client.getToken()).toBeNull();
    });

    it('verifyEmailCode: calls POST /v1/auth/email/verify, updates token, and returns result', async () => {
      mockResponse({ ok: true, token: 'email-verified-token', accountId: 'acc-email' });

      const res = await client.auth.verifyEmailCode('user@example.com', '123456');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/auth/email/verify');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(init?.body as string)).toEqual({ email: 'user@example.com', code: '123456' });
      expect(res).toEqual({ ok: true, token: 'email-verified-token', accountId: 'acc-email' });
      expect(client.getToken()).toBe('email-verified-token');
    });

    it('session: calls GET /v1/auth/session with auth header', async () => {
      client.setToken('session-check-token');
      mockResponse({ id: 'acc-123', username: 'alice' });

      const res = await client.auth.session();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/auth/session');
      expect(init?.method).toBe('GET');
      expect(init?.headers?.['Authorization']).toBe('Bearer session-check-token');
      expect(res).toEqual({ id: 'acc-123', username: 'alice' });
    });

    it('signOut: calls POST /v1/auth/signout and clears client token', async () => {
      client.setToken('token-to-be-cleared');
      mockResponse({ ok: true });

      const res = await client.auth.signOut();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/auth/signout');
      expect(init?.method).toBe('POST');
      expect(init?.headers?.['Authorization']).toBe('Bearer token-to-be-cleared');
      expect(res).toEqual({ ok: true });
      expect(client.getToken()).toBeNull();
    });
  });

  describe('QuestionsResource', () => {
    it('random: calls GET /v1/questions/random with category and exclude', async () => {
      const mockQuestion = {
        id: 'q-1',
        category: 'Science',
        prompt: 'What is H2O?',
        options: ['Water', 'Oxygen', 'Hydrogen', 'Helium'],
      };
      mockResponse(mockQuestion);

      const res = await client.questions.random({ category: 'Science', exclude: ['q-2', 'q-3'] });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/questions/random?category=Science&exclude=q-2%2Cq-3');
      expect(init?.method).toBe('GET');
      expect(res).toEqual(mockQuestion);
    });

    it('get: calls GET /v1/questions/:id', async () => {
      const mockQuestion = {
        id: 'q-100',
        category: 'History',
        prompt: 'Who was the first president?',
        options: ['Washington', 'Adams', 'Jefferson', 'Madison'],
      };
      mockResponse(mockQuestion);

      const res = await client.questions.get('q-100');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/questions/q-100');
      expect(init?.method).toBe('GET');
      expect(res).toEqual(mockQuestion);
    });

    it('count: calls GET /v1/questions/count', async () => {
      mockResponse({ count: 42 });

      const res = await client.questions.count();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/questions/count');
      expect(init?.method).toBe('GET');
      expect(res).toEqual({ count: 42 });
    });

    it('create: calls POST /v1/questions with body', async () => {
      client.setToken('author-token');
      mockResponse(undefined);

      const newQ = {
        prompt: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        correctIndex: 1,
        category: 'Math',
        explanation: 'Basic addition',
      };
      const res = await client.questions.create(newQ);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/questions');
      expect(init?.method).toBe('POST');
      expect(init?.headers?.['Authorization']).toBe('Bearer author-token');
      expect(JSON.parse(init?.body as string)).toEqual(newQ);
      expect(res).toBeUndefined();
    });

    it('generate: calls POST /v1/questions/generate with topic', async () => {
      client.setToken('gen-token');
      const generated = {
        prompt: 'What is photosynthesis?',
        options: ['Process in plants', 'Animal digestion', 'Rock formation', 'Cloud formation'],
        correctIndex: 0,
        explanation: 'Plants use sunlight to make food.',
      };
      mockResponse(generated);

      const res = await client.questions.generate('Biology');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/questions/generate');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(init?.body as string)).toEqual({ topic: 'Biology' });
      expect(res).toEqual(generated);
    });

    it('dispute: calls POST /v1/questions/:id/dispute with reason', async () => {
      client.setToken('dispute-token');
      mockResponse({ quarantined: true });

      const res = await client.questions.dispute('q-dispute', 'Incorrect correct answer');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/questions/q-dispute/dispute');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(init?.body as string)).toEqual({ reason: 'Incorrect correct answer' });
      expect(res).toEqual({ quarantined: true });
    });

    it('fiftyFifty: calls GET /v1/questions/:id/5050', async () => {
      client.setToken('lifeline-token');
      mockResponse([0, 2]);

      const res = await client.questions.fiftyFifty('q-5050');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/questions/q-5050/5050');
      expect(init?.method).toBe('GET');
      expect(res).toEqual([0, 2]);
    });
  });

  describe('QuizResource', () => {
    it('submitAnswer: calls POST /v1/quiz/answer with questionId and answerIndex', async () => {
      client.setToken('player-token');
      const answerResult = {
        isCorrect: true,
        correctIndex: 1,
        explanation: 'Right answer!',
        recorded: true,
      };
      mockResponse(answerResult);

      const res = await client.quiz.submitAnswer('q-answer-1', 1);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/quiz/answer');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(init?.body as string)).toEqual({ questionId: 'q-answer-1', answerIndex: 1 });
      expect(res).toEqual(answerResult);
    });

    it('submitAnswer with object parameter', async () => {
      client.setToken('player-token');
      mockResponse({ isCorrect: false, correctIndex: 2, recorded: true, explanation: null });

      const res = await client.quiz.submitAnswer({ questionId: 'q-answer-2', answerIndex: 0 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(JSON.parse(mockFetch.mock.calls[0][1]?.body as string)).toEqual({
        questionId: 'q-answer-2',
        answerIndex: 0,
      });
      expect(res.isCorrect).toBe(false);
    });

    it('history: calls GET /v1/quiz/history', async () => {
      client.setToken('history-token');
      const mockHistory = [
        { questionId: 'q-1', prompt: 'Prompt 1', isCorrect: true },
        { questionId: 'q-2', prompt: 'Prompt 2', isCorrect: false },
      ];
      mockResponse(mockHistory);

      const res = await client.quiz.history();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/quiz/history');
      expect(init?.method).toBe('GET');
      expect(res).toEqual(mockHistory);
    });

    it('stats: calls GET /v1/quiz/stats', async () => {
      client.setToken('stats-token');
      const mockStats = {
        score: 15,
        streak: 3,
        bestStreak: 7,
        accuracy: 85,
        totalAnswered: 20,
      };
      mockResponse(mockStats);

      const res = await client.quiz.stats();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/quiz/stats');
      expect(init?.method).toBe('GET');
      expect(res).toEqual(mockStats);
    });
  });

  describe('LeaderboardResource', () => {
    it('global: calls GET /v1/leaderboard with limit and offset', async () => {
      const mockLeaders = [
        { user_id: 'u-1', display_name: 'Alice', score: 100, accuracy: 90, rank: 1 },
      ];
      mockResponse(mockLeaders);

      const res = await client.leaderboard.global({ limit: 10, offset: 20 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/leaderboard?limit=10&offset=20');
      expect(init?.method).toBe('GET');
      expect(res).toEqual(mockLeaders);
    });

    it('group: calls GET /v1/leaderboard/group/:id with limit and offset', async () => {
      client.setToken('group-member-token');
      const mockLeaders = [
        { user_id: 'u-2', display_name: 'Bob', score: 80, accuracy: 80, rank: 1 },
      ];
      mockResponse(mockLeaders);

      const res = await client.leaderboard.group('grp-123', { limit: 25, offset: 0 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/leaderboard/group/grp-123?limit=25&offset=0');
      expect(init?.method).toBe('GET');
      expect(res).toEqual(mockLeaders);
    });
  });

  describe('CommunityResource', () => {
    it('rate: calls POST /v1/questions/:id/rate with rating', async () => {
      client.setToken('rater-token');
      mockResponse({ ok: true });

      const res = await client.community.rate('q-rate-1', 5);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/questions/q-rate-1/rate');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(init?.body as string)).toEqual({ rating: 5 });
      expect(res).toEqual({ ok: true });
    });

    it('comment: calls POST /v1/questions/:id/comment with body and kind', async () => {
      client.setToken('commenter-token');
      mockResponse({ ok: true });

      const res = await client.community.comment('q-com-1', 'Great question!', 'suggestion');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/questions/q-com-1/comment');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(init?.body as string)).toEqual({ body: 'Great question!', kind: 'suggestion' });
      expect(res).toEqual({ ok: true });
    });

    it('deleteComment: calls DELETE /v1/comments/:id', async () => {
      client.setToken('author-token');
      mockResponse({ ok: true });

      const res = await client.community.deleteComment('c-del-1');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/comments/c-del-1');
      expect(init?.method).toBe('DELETE');
      expect(res).toEqual({ ok: true });
    });

    it('resolveSuggestion: calls POST /v1/suggestions/:id/resolve', async () => {
      client.setToken('question-author-token');
      mockResponse({ ok: true });

      const res = await client.community.resolveSuggestion('sug-123');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/suggestions/sug-123/resolve');
      expect(init?.method).toBe('POST');
      expect(res).toEqual({ ok: true });
    });

    it('discussion: calls GET /v1/questions/:id/discussion with page', async () => {
      const mockDiscussion = {
        rating: { average: 4.5, count: 10 },
        myRating: 5,
        comments: [
          { id: 'c-1', body: 'Nice one', authorName: 'Dave', createdAt: '2026-10-12', mine: true },
        ],
        hasMore: false,
      };
      mockResponse(mockDiscussion);

      const res = await client.community.discussion('q-disc-1', { page: 2 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/questions/q-disc-1/discussion?page=2');
      expect(init?.method).toBe('GET');
      expect(res).toEqual(mockDiscussion);
    });

    it('suggestions: calls GET /v1/suggestions', async () => {
      client.setToken('author-token');
      const mockSuggestions = [
        {
          id: 's-1',
          questionId: 'q-1',
          questionPrompt: 'Prompt',
          body: 'Fix typo',
          senderName: 'Eve',
          createdAt: '2026-10-12',
          resolvedAt: null,
        },
      ];
      mockResponse(mockSuggestions);

      const res = await client.community.suggestions();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/suggestions');
      expect(init?.method).toBe('GET');
      expect(res).toEqual(mockSuggestions);
    });
  });

  describe('GroupsResource', () => {
    it('create: calls POST /v1/groups with name and description', async () => {
      client.setToken('group-admin-token');
      const mockGroup = {
        id: 'grp-new',
        name: 'Trivia Masters',
        description: 'For pros only',
        created_at: '2026-10-12',
      };
      mockResponse(mockGroup);

      const res = await client.groups.create('Trivia Masters', 'For pros only');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/groups');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(init?.body as string)).toEqual({ name: 'Trivia Masters', description: 'For pros only' });
      expect(res).toEqual(mockGroup);
    });

    it('list: calls GET /v1/groups', async () => {
      client.setToken('user-token');
      const mockGroups = [
        { id: 'grp-1', name: 'Group 1', description: null, created_at: '2026-10-12' },
      ];
      mockResponse(mockGroups);

      const res = await client.groups.list();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/groups');
      expect(init?.method).toBe('GET');
      expect(res).toEqual(mockGroups);
    });

    it('join: calls POST /v1/groups/:id/join', async () => {
      client.setToken('joiner-token');
      mockResponse({ ok: true });

      const res = await client.groups.join('grp-join');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/groups/grp-join/join');
      expect(init?.method).toBe('POST');
      expect(res).toEqual({ ok: true });
    });

    it('leave: calls POST /v1/groups/:id/leave', async () => {
      client.setToken('leaver-token');
      mockResponse({ ok: true });

      const res = await client.groups.leave('grp-leave');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/groups/grp-leave/leave');
      expect(init?.method).toBe('POST');
      expect(res).toEqual({ ok: true });
    });
  });

  describe('DiscoveryResource', () => {
    it('search: calls GET /v1/search with q, limit, offset, and page', async () => {
      const mockSearchResult = {
        results: [
          { id: 'q-res-1', prompt: 'Solar system', category: 'Astronomy', authorName: 'Galileo', createdAt: '2026-10-12' },
        ],
        hasMore: false,
      };
      mockResponse(mockSearchResult);

      const res = await client.discovery.search('solar', { limit: 10, offset: 0, page: 1 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/search?q=solar&limit=10&offset=0&page=1');
      expect(init?.method).toBe('GET');
      expect(res).toEqual(mockSearchResult);
    });

    it('topics: calls GET /v1/topics', async () => {
      const mockTopics = [
        { name: 'Science', questionCount: 120, latestAt: '2026-10-12' },
        { name: 'History', questionCount: 95, latestAt: '2026-10-11' },
      ];
      mockResponse(mockTopics);

      const res = await client.discovery.topics();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/topics');
      expect(init?.method).toBe('GET');
      expect(res).toEqual(mockTopics);
    });

    it('topicQuestions: calls GET /v1/topics/:topic/questions with params', async () => {
      const mockTopicQuestions = {
        results: [
          { id: 'q-topic-1', prompt: 'Physics q', category: 'Physics', authorName: 'Newton', createdAt: '2026-10-12' },
        ],
        hasMore: true,
      };
      mockResponse(mockTopicQuestions);

      const res = await client.discovery.topicQuestions('Physics & Chemistry', { page: 2 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/topics/Physics%20%26%20Chemistry/questions?page=2');
      expect(init?.method).toBe('GET');
      expect(res).toEqual(mockTopicQuestions);
    });
  });

  describe('ProfileResource', () => {
    it('quizzes: calls GET /v1/profile/quizzes with filter params', async () => {
      client.setToken('profile-token');
      const mockUserQuizzes = {
        quizzes: [
          { id: 'q-my-1', category: 'Art', prompt: 'Mona Lisa', options: ['Da Vinci', 'Picasso', 'Monet', 'Dali'], status: 'verified' as const },
        ],
        count: 1,
      };
      mockResponse(mockUserQuizzes);

      const res = await client.profile.quizzes({ limit: 5, offset: 10, category: 'Art', status: 'verified' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/profile/quizzes?limit=5&offset=10&category=Art&status=verified');
      expect(init?.method).toBe('GET');
      expect(res).toEqual(mockUserQuizzes);
    });

    it('export: calls GET /v1/profile/export', async () => {
      client.setToken('profile-token');
      const mockExportData = {
        accountId: 'acc-1',
        exportedAt: '2026-10-12',
        version: '1.0',
        quizzes: [],
        stats: [],
      };
      mockResponse(mockExportData);

      const res = await client.profile.export();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/profile/export');
      expect(init?.method).toBe('GET');
      expect(res).toEqual(mockExportData);
    });

    it('analytics: calls GET /v1/profile/analytics', async () => {
      client.setToken('profile-token');
      const mockAnalytics = [
        { question_id: 'q-a-1', prompt: 'Prompt A', play_count: 50, accuracy_rate: 0.72 },
      ];
      mockResponse(mockAnalytics);

      const res = await client.profile.analytics();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.quickquiz.app/v1/profile/analytics');
      expect(init?.method).toBe('GET');
      expect(res).toEqual(mockAnalytics);
    });
  });
});
