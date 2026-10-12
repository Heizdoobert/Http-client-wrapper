export type {
  Question,
  ClientQuestion,
  QuestionDispute,
  QuizResult,
  Group,
  UserStats,
  LeaderboardEntry,
  AnswerSubmissionResult,
  SearchResult,
  HistoryItem,
  ActionErrorCode,
  ActionResult,
  PaginationParams,
  GetUserQuizzesFilter,
  UserBackupData,
  ProfileErrorCode,
  GetUserQuizzesResult,
  ExportUserDataResult,
  CommunityErrorCode,
  CommunityResult,
  RatingSummary,
  CommentView,
  SuggestionView,
} from '../../lib/types';

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
