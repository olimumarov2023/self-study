# Assessments API Contract

All endpoints require `Authorization: Bearer <jwt>`.
User ID is extracted from the JWT via `@CurrentUser()` decorator (same pattern as `LearningItemController`).

---

## Enums

```typescript
enum AssessmentMode {
  QUIZ = 'QUIZ',               // Multiple-choice questions
  QA = 'QA',                   // Open-ended Q&A
  TASK = 'TASK',               // Practical coding/design task
  FLASHCARD = 'FLASHCARD',     // Term <-> definition cards
  TEACH_BACK = 'TEACH_BACK',   // "Explain as if to a junior"
  BUG_ANALYSIS = 'BUG_ANALYSIS' // Find/fix bugs in code snippets
}

enum AssessmentStatus {
  GENERATING = 'GENERATING',   // AI generation queued/in-progress
  READY = 'READY',             // Questions generated, awaiting submission
  SUBMITTED = 'SUBMITTED',     // Answers submitted, evaluation queued
  EVALUATED = 'EVALUATED',     // Scoring complete
  FAILED = 'FAILED'            // AI generation or evaluation failed
}
```

---

## Prisma Schema Additions

```prisma
enum AssessmentMode {
  QUIZ
  QA
  TASK
  FLASHCARD
  TEACH_BACK
  BUG_ANALYSIS
}

enum AssessmentStatus {
  GENERATING
  READY
  SUBMITTED
  EVALUATED
  FAILED
}

model Assessment {
  id               String           @id @default(cuid())
  userId           String
  learningItemId   String
  mode             AssessmentMode
  status           AssessmentStatus @default(GENERATING)
  difficulty       Int              @default(3)    // 1-5, mirrors LearningItem.difficulty
  questionCount    Int              @default(5)
  userComment      String?                         // optional context hint for AI
  questions        Json                            // mode-specific question payload
  answers          Json?                           // user-submitted answers
  score            Int?                            // 0-100
  maxScore         Int?                            // max achievable points
  feedback         Json?                           // AI evaluation result
  weakConcepts     String[]                        // extracted weak areas
  confidenceScore  Float?                          // 0.0-1.0 AI confidence estimate
  errorMessage     String?                         // populated when status = FAILED
  startedAt        DateTime?                       // when user first viewed questions
  submittedAt      DateTime?                       // when user submitted answers
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  learningItem     LearningItem     @relation(fields: [learningItemId], references: [id], onDelete: Cascade)
  reviewSchedule   ReviewSchedule?

  @@index([userId, learningItemId])
  @@index([userId, createdAt])
}
```

Add to `User` model: `assessments Assessment[]`
Add to `LearningItem` model: `assessments Assessment[]`

---

## POST /assessments/generate

Generate a new assessment for a learning item. Queues a BullMQ job; returns immediately with status `GENERATING`.

### Request

```typescript
interface GenerateAssessmentDto {
  learningItemId: string;  // required, must exist and belong to user
  mode: AssessmentMode;    // required
  difficulty?: number;     // 1-5, defaults to learning item's difficulty
  questionCount?: number;  // 1-20, default 5
  comment?: string;        // max 500 chars, optional hint for AI
}
```

### Validation Rules

| Field            | Rule                                          |
|------------------|-----------------------------------------------|
| learningItemId   | non-empty string, must resolve to user's item |
| mode             | must be valid AssessmentMode enum value        |
| difficulty       | integer 1-5                                   |
| questionCount    | integer 1-20                                  |
| comment          | string, max 500 characters                    |

### Response `201 Created`

```typescript
interface GenerateAssessmentResponse {
  id: string;
  learningItemId: string;
  mode: AssessmentMode;
  status: 'GENERATING';
  difficulty: number;
  questionCount: number;
  createdAt: string; // ISO 8601
}
```

### Errors

| Status | Code                      | When                                          |
|--------|---------------------------|-----------------------------------------------|
| 400    | `VALIDATION_ERROR`        | Invalid body fields                           |
| 401    | `UNAUTHORIZED`            | Missing or invalid JWT                        |
| 404    | `LEARNING_ITEM_NOT_FOUND` | learningItemId does not exist or wrong user   |
| 409    | `ASSESSMENT_IN_PROGRESS`  | An unfinished assessment exists for this item |

---

## GET /assessments/:id

Poll for assessment status or retrieve generated questions. Used by frontend to poll while status is `GENERATING`.

### Response `200 OK`

```typescript
interface AssessmentResponse {
  id: string;
  learningItemId: string;
  learningItemTitle: string;
  mode: AssessmentMode;
  status: AssessmentStatus;
  difficulty: number;
  questionCount: number;
  userComment: string | null;
  questions: AssessmentQuestions | null;  // null while GENERATING
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
```

### Errors

| Status | Code                   | When                                   |
|--------|------------------------|----------------------------------------|
| 401    | `UNAUTHORIZED`         | Missing or invalid JWT                 |
| 404    | `ASSESSMENT_NOT_FOUND` | Assessment does not exist or wrong user |

---

## POST /assessments/:id/submit

Submit user answers for evaluation. Queues evaluation job; transitions status to `SUBMITTED`.

### Request

```typescript
interface SubmitAssessmentDto {
  answers: AssessmentAnswers; // mode-specific, see shapes below
}
```

### Mode-Specific Answer Shapes

```typescript
// QUIZ
interface QuizAnswers {
  responses: Array<{
    questionIndex: number;
    selectedOptionIndex: number; // 0-based index into options array
  }>;
}

// QA
interface QaAnswers {
  responses: Array<{
    questionIndex: number;
    answer: string; // free-text, max 2000 chars per answer
  }>;
}

// TASK
interface TaskAnswers {
  responses: Array<{
    taskIndex: number;
    solution: string; // code or text, max 5000 chars
    language?: string; // e.g. "typescript", "python"
  }>;
}

// FLASHCARD
interface FlashcardAnswers {
  responses: Array<{
    cardIndex: number;
    userAnswer: string; // max 500 chars
    selfRating: 1 | 2 | 3; // 1=wrong, 2=partial, 3=correct
  }>;
}

// TEACH_BACK
interface TeachBackAnswers {
  responses: Array<{
    promptIndex: number;
    explanation: string; // max 3000 chars
  }>;
}

// BUG_ANALYSIS
interface BugAnalysisAnswers {
  responses: Array<{
    snippetIndex: number;
    identifiedBugs: string[];       // descriptions of bugs found
    proposedFixes: string[];        // corresponding fixes
    explanation: string;            // max 2000 chars
  }>;
}

type AssessmentAnswers =
  | QuizAnswers
  | QaAnswers
  | TaskAnswers
  | FlashcardAnswers
  | TeachBackAnswers
  | BugAnalysisAnswers;
```

### Response `200 OK`

```typescript
interface SubmitAssessmentResponse {
  id: string;
  status: 'SUBMITTED';
  submittedAt: string; // ISO 8601
}
```

### Errors

| Status | Code                      | When                                         |
|--------|---------------------------|----------------------------------------------|
| 400    | `VALIDATION_ERROR`        | Answers shape does not match mode             |
| 400    | `INCOMPLETE_ANSWERS`      | Not all questions answered                    |
| 401    | `UNAUTHORIZED`            | Missing or invalid JWT                        |
| 404    | `ASSESSMENT_NOT_FOUND`    | Assessment does not exist or wrong user       |
| 409    | `INVALID_STATUS`          | Assessment is not in READY status             |

---

## GET /assessments/:id/results

Retrieve evaluation results. Returns 409 if assessment is not yet evaluated.

### Response `200 OK`

```typescript
interface AssessmentResultsResponse {
  id: string;
  learningItemId: string;
  learningItemTitle: string;
  mode: AssessmentMode;
  difficulty: number;
  score: number;         // 0-100
  maxScore: number;
  percentage: number;    // computed: Math.round(score / maxScore * 100)
  feedback: AssessmentFeedback;
  weakConcepts: string[];
  confidenceScore: number; // 0.0-1.0
  reviewScheduled: {
    nextReviewDate: string;  // ISO 8601 date
    intervalDays: number;
  } | null;
  submittedAt: string;
  evaluatedAt: string;
}

interface AssessmentFeedback {
  summary: string;                     // 1-3 sentence overall summary
  perQuestion: QuestionFeedback[];     // one per question/task
  revisionRecommendations: string[];   // actionable study suggestions
  strengths: string[];                 // what the user did well
}

interface QuestionFeedback {
  questionIndex: number;
  correct: boolean;
  pointsAwarded: number;
  pointsPossible: number;
  explanation: string;        // why correct/incorrect
  conceptTested: string;      // the concept this question targets
}
```

### Errors

| Status | Code                   | When                                       |
|--------|------------------------|--------------------------------------------|
| 401    | `UNAUTHORIZED`         | Missing or invalid JWT                     |
| 404    | `ASSESSMENT_NOT_FOUND` | Assessment does not exist or wrong user    |
| 409    | `NOT_YET_EVALUATED`    | Status is not EVALUATED (still processing) |

---

## GET /assessments/history

List past assessments for a learning item (or all items). Paginated.

### Query Parameters

```typescript
interface AssessmentHistoryQuery {
  learningItemId?: string;  // filter to one item
  mode?: AssessmentMode;    // filter by mode
  status?: AssessmentStatus;
  page?: number;            // default 1, min 1
  limit?: number;           // default 20, min 1, max 100
  sortBy?: 'createdAt' | 'score'; // default 'createdAt'
  sortOrder?: 'asc' | 'desc';     // default 'desc'
}
```

### Response `200 OK`

```typescript
interface AssessmentHistoryResponse {
  data: AssessmentSummary[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AssessmentSummary {
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
```

### Errors

| Status | Code               | When                   |
|--------|--------------------|------------------------|
| 400    | `VALIDATION_ERROR` | Invalid query params   |
| 401    | `UNAUTHORIZED`     | Missing or invalid JWT |

---

## Mode-Specific Question Shapes

These are the `questions` JSON payloads stored in `Assessment.questions`, returned by `GET /assessments/:id`.

```typescript
// QUIZ
interface QuizQuestions {
  questions: Array<{
    question: string;
    options: string[];         // 4 options
    correctOptionIndex: number; // 0-based, stripped from response to user
    conceptTested: string;
    pointValue: number;
  }>;
}

// QA
interface QaQuestions {
  questions: Array<{
    question: string;
    expectedKeyPoints: string[]; // stripped from response to user
    conceptTested: string;
    pointValue: number;
  }>;
}

// TASK
interface TaskQuestions {
  tasks: Array<{
    description: string;
    requirements: string[];
    sampleInput?: string;
    expectedOutput?: string;    // stripped from response to user
    language?: string;
    conceptTested: string;
    pointValue: number;
  }>;
}

// FLASHCARD
interface FlashcardQuestions {
  cards: Array<{
    front: string;  // term or question
    back: string;   // definition or answer (revealed after user attempt)
    conceptTested: string;
    pointValue: number;
  }>;
}

// TEACH_BACK
interface TeachBackQuestions {
  prompts: Array<{
    topic: string;
    scenario: string;          // e.g. "Explain X to a junior developer who knows Y"
    expectedCoverage: string[]; // stripped from response to user
    conceptTested: string;
    pointValue: number;
  }>;
}

// BUG_ANALYSIS
interface BugAnalysisQuestions {
  snippets: Array<{
    code: string;
    language: string;
    context: string;            // what the code is supposed to do
    bugs: string[];             // stripped from response to user
    conceptTested: string;
    pointValue: number;
  }>;
}

type AssessmentQuestions =
  | QuizQuestions
  | QaQuestions
  | TaskQuestions
  | FlashcardQuestions
  | TeachBackQuestions
  | BugAnalysisQuestions;
```

**Important**: Fields marked "stripped from response to user" must be removed by the backend before sending the response for `GET /assessments/:id` when `status` is `READY` (i.e., before the user has submitted answers). After evaluation (`status = EVALUATED`), the full payload is returned.

---

## Error Response Shape

All errors follow this format (consistent with existing API patterns):

```typescript
interface ApiError {
  statusCode: number;
  code: string;       // machine-readable error code from tables above
  message: string;    // human-readable description
  timestamp: string;  // ISO 8601
}
```
