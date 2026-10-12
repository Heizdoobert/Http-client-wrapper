export interface Question {
  id: string;
  category: string;
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  created_by_user: string | null;
  status?: 'verified' | 'pending' | 'quarantined' | 'rejected';
  dispute_count?: number;
  created_at: string;
}

export interface ClientQuestion {
  id: string;
  category: string;
  prompt: string;
  options: string[];
  status?: 'verified' | 'pending' | 'quarantined' | 'rejected';
  created_by?: string | null;
  created_at?: string;
}

export interface QuestionDispute {
  id: string;
  question_id: string;
  reason: string;
  created_at: string;
}

export interface QuizResult {
  id: string;
  user_id: string;
  question_id: string;
  answer_index: number;
  is_correct: boolean;
  answered_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface UserStats {
  score: number;
  streak: number;
  bestStreak: number;
  accuracy: number;
  totalAnswered: number;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  score: number;
  accuracy: number;
  rank: number;
}

export interface AnswerSubmissionResult {
  isCorrect: boolean;
  correctIndex: number;
  explanation: string | null;
  recorded: boolean;
  notSavedReason?: 'signed-out' | 'already-answered' | 'own-question' | 'rate-limited' | 'error';
}

export interface SearchResult {
  id: string;
  prompt: string;
  category: string;
  authorName: string;
  createdAt: string;
  score?: number;
}

export interface HistoryItem {
  questionId: string;
  prompt: string;
  isCorrect: boolean;
}

export type ActionErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export type ActionResult<T = void> =
  | { success: true; data: T }
  | {
      success: false;
      error: {
        code: ActionErrorCode | string;
        message: string;
        details?: unknown;
      };
    };

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface GetUserQuizzesFilter extends PaginationParams {
  category?: string;
  status?: Question['status'];
}

export interface UserBackupData {
  accountId: string;
  exportedAt: string;
  version: string;
  quizzes: Question[];
  stats: QuizResult[];
  isTruncated?: boolean;
}

export type ProfileErrorCode =
  | 'FETCH_FAILED'
  | 'EXPORT_FAILED'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'UNKNOWN_ERROR';

export type GetUserQuizzesResult =
  | { success: true; quizzes: ClientQuestion[]; count: number }
  | { success: false; error: string; code: ProfileErrorCode };

export type ExportUserDataResult =
  | { success: true; data: UserBackupData }
  | { success: false; error: string; code: ProfileErrorCode };

export type CommunityErrorCode =
  | 'UNAUTHORIZED'
  | 'NOT_ANSWERED'
  | 'NOT_ALLOWED'
  | 'INVALID'
  | 'RATE_LIMITED'
  | 'FAILED';

export type CommunityResult = { ok: true } | { ok: false; code: CommunityErrorCode };

export interface RatingSummary {
  average: number | null;
  count: number;
}

export interface CommentView {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
  mine: boolean;
}

export interface SuggestionView {
  id: string;
  questionId: string;
  questionPrompt: string;
  body: string;
  senderName: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AuthSession {
  id: string;
  username: string;
}

export interface AuthResult {
  token: string;
  accountId: string;
}

export interface VerifyEmailResult {
  ok: boolean;
  token: string;
  accountId: string;
}

export interface GeneratedQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CreateQuestionInput {
  prompt: string;
  options: string[];
  correctIndex: number;
  category?: string;
  explanation?: string;
}

export interface DiscussionView {
  rating: {
    average: number | null;
    count: number;
  };
  myRating: number | null;
  comments: Array<{
    id: string;
    body: string;
    authorName: string;
    createdAt: string;
    mine: boolean;
  }>;
  hasMore: boolean;
}

export interface SearchResultPage {
  results: Array<{
    id: string;
    prompt: string;
    category: string;
    authorName: string;
    createdAt: string;
    score?: number;
  }>;
  hasMore: boolean;
}

export interface TopicInfo {
  name: string;
  questionCount: number;
  latestAt: string;
}

export interface QuestionAnalytics {
  question_id: string;
  prompt: string;
  play_count: number;
  accuracy_rate: number;
}

export interface UserQuizzesResult {
  quizzes: Array<{
    id: string;
    category: string;
    prompt: string;
    options: string[];
    status?: 'verified' | 'pending' | 'quarantined' | 'rejected';
    created_by?: string | null;
    created_at?: string;
  }>;
  count: number;
}
