import type { AssessmentMode, AssessmentStatus } from '@/types/enums';

// ---------------------------------------------------------------------------
// Mode-specific question shapes (GET /assessments/:id — questions field)
// ---------------------------------------------------------------------------

export interface QuizQuestion {
  question: string;
  options: string[];
  /** Stripped from response while status is READY */
  correctOptionIndex?: number;
  conceptTested: string;
  pointValue: number;
}

export interface QuizQuestions {
  questions: QuizQuestion[];
}

export interface QaQuestion {
  question: string;
  /** Stripped from response while status is READY */
  expectedKeyPoints?: string[];
  conceptTested: string;
  pointValue: number;
}

export interface QaQuestions {
  questions: QaQuestion[];
}

export interface TaskQuestion {
  description: string;
  requirements: string[];
  sampleInput?: string;
  /** Stripped from response while status is READY */
  expectedOutput?: string;
  language?: string;
  conceptTested: string;
  pointValue: number;
}

export interface TaskQuestions {
  tasks: TaskQuestion[];
}

export interface FlashcardQuestion {
  front: string;
  back: string;
  conceptTested: string;
  pointValue: number;
}

export interface FlashcardQuestions {
  cards: FlashcardQuestion[];
}

export interface TeachBackPrompt {
  topic: string;
  scenario: string;
  /** Stripped from response while status is READY */
  expectedCoverage?: string[];
  conceptTested: string;
  pointValue: number;
}

export interface TeachBackQuestions {
  prompts: TeachBackPrompt[];
}

export interface BugAnalysisSnippet {
  code: string;
  language: string;
  context: string;
  /** Stripped from response while status is READY */
  bugs?: string[];
  conceptTested: string;
  pointValue: number;
}

export interface BugAnalysisQuestions {
  snippets: BugAnalysisSnippet[];
}

export type AssessmentQuestions =
  | QuizQuestions
  | QaQuestions
  | TaskQuestions
  | FlashcardQuestions
  | TeachBackQuestions
  | BugAnalysisQuestions;

// ---------------------------------------------------------------------------
// Mode-specific answer shapes (POST /assessments/:id/submit)
// ---------------------------------------------------------------------------

export interface QuizAnswers {
  responses: Array<{
    questionIndex: number;
    selectedOptionIndex: number;
  }>;
}

export interface QaAnswers {
  responses: Array<{
    questionIndex: number;
    answer: string;
  }>;
}

export interface TaskAnswers {
  responses: Array<{
    taskIndex: number;
    solution: string;
    language?: string;
  }>;
}

export interface FlashcardAnswers {
  responses: Array<{
    cardIndex: number;
    userAnswer: string;
    selfRating: 1 | 2 | 3;
  }>;
}

export interface TeachBackAnswers {
  responses: Array<{
    promptIndex: number;
    explanation: string;
  }>;
}

export interface BugAnalysisAnswers {
  responses: Array<{
    snippetIndex: number;
    identifiedBugs: string[];
    proposedFixes: string[];
    explanation: string;
  }>;
}

export type AssessmentAnswers =
  | QuizAnswers
  | QaAnswers
  | TaskAnswers
  | FlashcardAnswers
  | TeachBackAnswers
  | BugAnalysisAnswers;

// ---------------------------------------------------------------------------
// Feedback shapes (GET /assessments/:id/results)
// ---------------------------------------------------------------------------

export interface QuestionFeedback {
  questionIndex: number;
  correct: boolean;
  pointsAwarded: number;
  pointsPossible: number;
  explanation: string;
  conceptTested: string;
}

export interface AssessmentFeedback {
  summary: string;
  perQuestion: QuestionFeedback[];
  revisionRecommendations: string[];
  strengths: string[];
}

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

/** Returned by POST /assessments/generate (201) */
export interface GenerateAssessmentResponse {
  id: string;
  learningItemId: string;
  mode: AssessmentMode;
  status: 'GENERATING';
  difficulty: number;
  questionCount: number;
  createdAt: string;
}

/** Returned by GET /assessments/:id (200) */
export interface AssessmentResponse {
  id: string;
  learningItemId: string;
  learningItemTitle: string;
  mode: AssessmentMode;
  status: AssessmentStatus;
  difficulty: number;
  questionCount: number;
  userComment: string | null;
  questions: AssessmentQuestions | null;
  score: number | null;
  maxScore: number | null;
  feedback: AssessmentFeedback | null;
  weakConcepts: string[];
  confidenceScore: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
}

/** Returned by POST /assessments/:id/submit (200) */
export interface SubmitAssessmentResponse {
  id: string;
  status: 'SUBMITTED';
  submittedAt: string;
}

/** Returned by GET /assessments/:id/results (200) */
export interface AssessmentResultsResponse {
  id: string;
  learningItemId: string;
  learningItemTitle: string;
  mode: AssessmentMode;
  difficulty: number;
  score: number;
  maxScore: number;
  percentage: number;
  feedback: AssessmentFeedback;
  weakConcepts: string[];
  confidenceScore: number;
  reviewScheduled: {
    nextReviewDate: string;
    intervalDays: number;
  } | null;
  submittedAt: string;
  evaluatedAt: string;
}

/** One entry in GET /assessments/history */
export interface AssessmentSummary {
  id: string;
  learningItemId: string;
  learningItemTitle: string;
  mode: AssessmentMode;
  status: AssessmentStatus;
  difficulty: number;
  questionCount: number;
  score: number | null;
  maxScore: number | null;
  weakConcepts: string[];
  createdAt: string;
  submittedAt: string | null;
}

/** Returned by GET /assessments/history (200) */
export interface AssessmentHistoryResponse {
  data: AssessmentSummary[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Request payload / query shapes
// ---------------------------------------------------------------------------

export interface GenerateAssessmentPayload {
  learningItemId: string;
  mode: AssessmentMode;
  difficulty?: number;
  questionCount?: number;
  comment?: string;
}

export interface SubmitAssessmentPayload {
  answers: AssessmentAnswers;
}

export interface AssessmentHistoryQuery {
  learningItemId?: string;
  mode?: AssessmentMode;
  status?: AssessmentStatus;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'score';
  sortOrder?: 'asc' | 'desc';
}
