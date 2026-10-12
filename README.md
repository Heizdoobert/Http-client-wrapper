# @quickquiz/sdk

Official TypeScript SDK for [Quick Quiz](https://quickquiz.app) — an interactive trivia platform featuring AI-generated and community-verified questions, real-time leaderboards, streaks, groups, and discussions.

[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Features

- **Full API Coverage**: Authentication, questions, quiz gameplay, global & group leaderboards, study groups, community ratings/discussions, user profiles, and discovery search.
- **Universal JavaScript / TypeScript**: Dual ESM and CommonJS support with strict TypeScript type definitions (`.d.ts`).
- **Zero Runtime Dependencies**: Built entirely around modern standard web fetch.
- **Server Middleware Included**: First-class Next.js route wrapper and Express middleware under `@quickquiz/sdk/server` with in-memory token verification caching.
- **Robust Error Handling**: Structured `QuickQuizError` classes with standard API error codes and HTTP statuses.

---

## Installation

`@quickquiz/sdk` is distributed via GitHub Packages.

### 1. Configure `.npmrc`

Add the `@quickquiz` scope registry to your `.npmrc` file:

```ini
@quickquiz:registry=https://npm.pkg.github.com
```

### 2. Install Package

```bash
# npm
npm install @quickquiz/sdk

# pnpm
pnpm add @quickquiz/sdk

# yarn
yarn add @quickquiz/sdk
```

---

## Quickstart

### Option A: Standalone Named Functions (Modular & Tree-shakeable)

```typescript
import {
  createClient,
  setDefaultClient,
  getRandomQuestion,
  signIn,
  submitQuizAnswer,
} from '@quickquiz/sdk';

// Initialize and set default client (or pass client explicitly as the first argument)
const client = createClient({ baseUrl: 'https://api.quickquiz.app' });
setDefaultClient(client);

// 1. Fetch a random question
const question = await getRandomQuestion({ category: 'Science' });
// or: await getRandomQuestion(client, { category: 'Science' });

// 2. Sign in
await signIn('alice', 'password123');

// 3. Submit an answer
if (question) {
  const result = await submitQuizAnswer(question.id, 0);
  console.log(result.isCorrect ? 'Correct!' : 'Incorrect!');
  console.log('Explanation:', result.explanation);
}
```

### Option B: Object-Oriented Client Instance

```typescript
import { QuickQuizClient } from '@quickquiz/sdk';

// Initialize client
const client = new QuickQuizClient({
  baseUrl: 'https://api.quickquiz.app',
});

// 1. Fetch a random question
const question = await client.questions.random({ category: 'Science' });
console.log('Question:', question?.prompt);

// 2. Sign in
await client.auth.signIn('alice', 'password123');

// 3. Submit an answer
if (question) {
  const result = await client.quiz.submitAnswer(question.id, 0);
  console.log(result.isCorrect ? 'Correct!' : 'Incorrect!');
  console.log('Explanation:', result.explanation);
}
```

---

## Client Configuration

```typescript
import { QuickQuizClient, type QuickQuizClientOptions } from '@quickquiz/sdk';

const options: QuickQuizClientOptions = {
  // Base URL of the Quick Quiz API instance
  baseUrl: 'https://api.quickquiz.app',

  // Optional initial Bearer token (e.g. from existing session)
  token: 'existing-jwt-token',

  // Optional custom fetch implementation (useful for testing or mocking)
  fetch: globalThis.fetch,
};

const client = new QuickQuizClient(options);

// Inspect or manually update authentication token
const token = client.getToken();
client.setToken('new-token-string');
client.setToken(null); // clears token
```

---

## Resource Modules

### 1. Authentication (`client.auth`)

Manage user registration, credential login, OAuth sign-in, passwordless email verification, and session lifecycle. When signing in or registering, the client automatically captures and persists the Bearer token for subsequent authenticated calls.

```typescript
// Register new account
const registration = await client.auth.signUp('username', 'secure-password');
console.log('Registered account ID:', registration.accountId);

// Sign in with credentials
const session = await client.auth.signIn('username', 'secure-password');

// Google OAuth Sign-in
await client.auth.signInWithGoogle('google-id-token');

// Passwordless email code verification
await client.auth.requestEmailCode('user@example.com');
await client.auth.verifyEmailCode('user@example.com', '123456');

// Inspect active session
const me = await client.auth.session();
console.log('Current user:', me.username);

// Sign out (clears token on client)
await client.auth.signOut();
```

---

### 2. Questions (`client.questions`)

Fetch questions, retrieve verified counts, generate AI questions, report/dispute flawed questions, and request 50/50 lifelines.

```typescript
// Random question with filters
const question = await client.questions.random({
  category: 'History',
  exclude: ['q-prev-1', 'q-prev-2'],
});

// Retrieve question by ID
const questionDetails = await client.questions.get('question-uuid');

// Total verified questions count
const { count } = await client.questions.count();

// Create a new question submission (requires auth)
await client.questions.create({
  prompt: 'What year did Apollo 11 land on the Moon?',
  options: ['1967', '1968', '1969', '1970'],
  correctIndex: 2,
  category: 'History',
  explanation: 'Apollo 11 landed on July 20, 1969.',
});

// Generate question with AI (requires auth)
const aiQuestion = await client.questions.generate('Quantum Mechanics');

// Report / dispute a question (requires auth)
await client.questions.dispute('question-uuid', 'Incorrect answer marked as right');

// 50/50 Lifeline (requires auth) - returns indices of two incorrect options to eliminate
const eliminatedIndices = await client.questions.fiftyFifty('question-uuid');
```

---

### 3. Quiz Gameplay & Stats (`client.quiz`)

Submit answers and track personal history and statistics.

```typescript
// Submit answer (requires auth)
const result = await client.quiz.submitAnswer('question-uuid', 2);
console.log(result.isCorrect); // boolean
console.log(result.explanation); // string | null
console.log(result.recorded); // boolean

// Recent answered question history (requires auth)
const history = await client.quiz.history();

// User statistics and streaks (requires auth)
const stats = await client.quiz.stats();
console.log('Best streak:', stats.bestStreak);
console.log('Accuracy:', stats.accuracy);
```

---

### 4. Leaderboards (`client.leaderboard`)

Access global rankings and scoped group leaderboards.

```typescript
// Global leaderboard
const globalBoard = await client.leaderboard.global({ limit: 50, offset: 0 });
for (const entry of globalBoard) {
  console.log(`#${entry.rank} - ${entry.display_name}: ${entry.score} pts`);
}

// Group-specific leaderboard
const groupBoard = await client.leaderboard.group('group-uuid', { limit: 25 });
```

---

### 5. Study Groups (`client.groups`)

Form learning groups, join existing communities, and manage memberships.

> Note: Group leaderboards are accessed via [`client.leaderboard.group(groupId)`](#4-leaderboards-clientleaderboard).

```typescript
// List groups the authenticated user belongs to (requires auth)
const myGroups = await client.groups.list();

// Create a new group (requires auth)
const newGroup = await client.groups.create({
  name: 'Biology Enthusiasts',
  description: 'Weekly biology quizzes and study sessions',
});

// Join an existing group by ID (requires auth)
await client.groups.join('group-uuid');

// Leave a group by ID (requires auth)
await client.groups.leave('group-uuid');
```

---

### 6. Community & Discussions (`client.community`)

Rate questions, participate in question discussions and suggestions, and manage user feedback.

```typescript
// View question discussions (ratings summary and paginated comments)
const discussion = await client.community.discussion('question-uuid', { page: 1 });
console.log('Average rating:', discussion.rating.average);
console.log('Total comments:', discussion.comments.length);

// Submit a 1-5 star rating for a question (requires auth & prior answer)
await client.community.rate('question-uuid', 5);

// Post a comment or suggestion on a question (requires auth & prior answer)
await client.community.comment('question-uuid', {
  body: 'Great question on orbital mechanics!',
  kind: 'comment', // or 'suggestion'
});

// Delete a comment authored by the current user (requires auth)
await client.community.deleteComment('comment-uuid');

// Mark a question improvement suggestion as resolved (requires auth & question authorship)
await client.community.resolveSuggestion('suggestion-uuid');

// Get pending suggestions on questions authored by current user (requires auth)
const pendingSuggestions = await client.community.suggestions();
```

---

### 7. Profile & Account Management (`client.profile`)

Access author quiz management, question performance analytics, and account data exports.

> Note: Current user identity and account session are accessed via [`client.auth.session()`](#1-authentication-clientauth).

```typescript
// Get questions authored by current user with optional filters and pagination (requires auth)
const authoredQuizzes = await client.profile.quizzes({
  category: 'Science',
  status: 'verified',
  limit: 20,
  offset: 0,
});
console.log('Total authored quizzes:', authoredQuizzes.count);

// Get analytics on questions authored by current user (requires auth)
const analytics = await client.profile.analytics();
for (const stat of analytics) {
  console.log(`${stat.prompt}: ${stat.play_count} plays, ${stat.accuracy_rate}% accuracy`);
}

// Export complete user account data (created quizzes and quiz history) (requires auth)
const backupData = await client.profile.export();
console.log('Exported quizzes count:', backupData.quizzes.length);
```

---

### 8. Discovery & Search (`client.discovery`)

Search across questions and explore question topics and categories.

```typescript
// Search questions by keyword with pagination
const searchResults = await client.discovery.search('quantum computing', {
  limit: 10,
  offset: 0,
});
for (const match of searchResults.results) {
  console.log(`[${match.category}] ${match.prompt}`);
}

// List all question topics with count and recent activity
const topics = await client.discovery.topics();

// Get questions filed under a specific topic/category with pagination
const topicQuestions = await client.discovery.topicQuestions('physics', {
  limit: 20,
  offset: 0,
});
```

---

## Server-Side Authentication (`@quickquiz/sdk/server`)

The SDK provides ready-to-use middleware for verifying Quick Quiz Bearer tokens in your own backend services, with built-in in-memory caching and SHA-256 token hashing.

```typescript
import {
  createTokenVerifier,
  withQuickQuizAuth,
  quickQuizAuth,
  getBearerToken,
} from '@quickquiz/sdk/server';

// Create a verifier instance
const verifier = createTokenVerifier({
  baseUrl: 'https://api.quickquiz.app',
  ttlMs: 30_000,     // 30 seconds verdict cache
  maxEntries: 10_000, // Evicts oldest on overflow
});
```

### Next.js Route Handler Wrapper

```typescript
import { withQuickQuizAuth } from '@quickquiz/sdk/server';
import { NextResponse } from 'next/server';

// Required authentication (returns 401 if unauthorized)
export const GET = withQuickQuizAuth(async (req, { account }) => {
  return NextResponse.json({
    message: `Hello ${account.username}`,
    userId: account.id,
  });
}, { mode: 'required', verifier });

// Optional authentication (passes account: null if anonymous)
export const POST = withQuickQuizAuth(async (req, { account }) => {
  if (!account) {
    return NextResponse.json({ message: 'Anonymous viewer' });
  }
  return NextResponse.json({ message: `Signed in as ${account.username}` });
}, { mode: 'optional', verifier });
```

### Express Middleware

```typescript
import express from 'express';
import { quickQuizAuth } from '@quickquiz/sdk/server';

const app = express();

// Protect routes
app.get('/api/protected', quickQuizAuth({ mode: 'required', verifier }), (req, res) => {
  res.json({ account: req.quickQuizAccount });
});

// Optional authentication
app.get('/api/public-or-private', quickQuizAuth({ mode: 'optional', verifier }), (req, res) => {
  res.json({ account: req.quickQuizAccount ?? null });
});
```

---

## Error Handling

All failed API requests throw an instance of `QuickQuizError`:

```typescript
import { QuickQuizClient, QuickQuizError } from '@quickquiz/sdk';

try {
  await client.questions.get('invalid-id');
} catch (error) {
  if (error instanceof QuickQuizError) {
    console.error(`Error Code: ${error.code}`);       // e.g. "NOT_FOUND"
    console.error(`HTTP Status: ${error.status}`);     // e.g. 404
    console.error(`Message: ${error.message}`);         // e.g. "Question not found"
    console.error(`Details:`, error.details);
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | `400` | Missing or invalid parameters in request payload |
| `UNAUTHORIZED` | `401` | Authentication required or Bearer token is invalid/expired |
| `NOT_ALLOWED` | `403` | User does not have permission to perform this action |
| `NOT_FOUND` | `404` | Target question, group, comment, or user not found |
| `CONFLICT` | `409` | Username already taken or duplicate resource |
| `RATE_LIMITED` | `429` | Request throttled due to rate limiting |
| `SERVER_ERROR` | `500` / `503` | Backend server error or upstream outage |
| `NETWORK_ERROR` | `0` | Connection failure, DNS error, or timeout |

---

## Building the SDK

To build the SDK bundle from source:

```bash
# In the workspace root
npm run build:sdk

# Or inside sdk
cd sdk
npx tsup
```

This compiles:
- `dist/index.mjs` (ESM bundle)
- `dist/index.cjs` (CommonJS bundle)
- `dist/index.d.ts` (TypeScript type declarations)
- `dist/server.mjs`, `dist/server.cjs`, `dist/server.d.ts` (Server SDK subpath bundle)

---

## License

MIT © [Quick Quiz](https://quickquiz.app)
