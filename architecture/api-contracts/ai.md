# AI Service Internal Contract

This module is **not exposed as HTTP endpoints**. It is an internal NestJS service (`AiService`) consumed by the assessment module's BullMQ job processors.

Module: `AiModule` (exports `AiService`)
Consumed by: `AssessmentModule` (imports `AiModule`)

---

## AiService Interface

```typescript
interface IAiService {
  generateAssessment(params: GenerateAssessmentParams): Promise<GeneratedAssessment>;
  evaluateAnswers(params: EvaluateAnswersParams): Promise<EvaluationResult>;
}
```

---

## generateAssessment

Called by the `assessment-generation` BullMQ job processor.

### Input

```typescript
interface GenerateAssessmentParams {
  mode: AssessmentMode;
  topic: string;              // LearningItem.title
  description: string | null; // LearningItem.description
  notes: string | null;       // LearningItem.notes
  tags: string[];             // LearningItem.tags
  difficulty: number;         // 1-5
  questionCount: number;      // 1-20
  userComment: string | null; // optional user hint
}
```

### Output

Returns a discriminated union based on `mode`:

```typescript
type GeneratedAssessment =
  | { mode: 'QUIZ'; payload: QuizQuestions }
  | { mode: 'QA'; payload: QaQuestions }
  | { mode: 'TASK'; payload: TaskQuestions }
  | { mode: 'FLASHCARD'; payload: FlashcardQuestions }
  | { mode: 'TEACH_BACK'; payload: TeachBackQuestions }
  | { mode: 'BUG_ANALYSIS'; payload: BugAnalysisQuestions };
```

### Per-Mode Output Shapes

```typescript
interface QuizQuestions {
  questions: Array<{
    question: string;
    options: string[];          // exactly 4 options
    correctOptionIndex: number; // 0-3
    conceptTested: string;
    pointValue: number;         // default 1 per question
  }>;
}

interface QaQuestions {
  questions: Array<{
    question: string;
    expectedKeyPoints: string[];  // 2-5 key points for evaluation
    conceptTested: string;
    pointValue: number;
  }>;
}

interface TaskQuestions {
  tasks: Array<{
    description: string;
    requirements: string[];       // acceptance criteria
    sampleInput?: string;
    expectedOutput?: string;
    language?: string;            // suggested language
    conceptTested: string;
    pointValue: number;
  }>;
}

interface FlashcardQuestions {
  cards: Array<{
    front: string;
    back: string;
    conceptTested: string;
    pointValue: number;
  }>;
}

interface TeachBackQuestions {
  prompts: Array<{
    topic: string;
    scenario: string;              // "Explain X to a junior who knows Y"
    expectedCoverage: string[];    // 3-6 points the explanation should cover
    conceptTested: string;
    pointValue: number;
  }>;
}

interface BugAnalysisQuestions {
  snippets: Array<{
    code: string;
    language: string;
    context: string;
    bugs: string[];                // 1-3 intentional bugs per snippet
    conceptTested: string;
    pointValue: number;
  }>;
}
```

---

## evaluateAnswers

Called by the `assessment-evaluation` BullMQ job processor.

### Input

```typescript
interface EvaluateAnswersParams {
  mode: AssessmentMode;
  topic: string;                   // LearningItem.title
  difficulty: number;              // 1-5
  questions: AssessmentQuestions;   // full questions payload (with answer keys)
  answers: AssessmentAnswers;      // user's submitted answers
}
```

(`AssessmentQuestions` and `AssessmentAnswers` types defined in assessments.md)

### Output

```typescript
interface EvaluationResult {
  score: number;                           // 0 to maxScore
  maxScore: number;                        // sum of all pointValues
  feedback: EvaluationFeedback;
  weakConcepts: string[];                  // concepts where points were lost
  confidenceScore: number;                 // 0.0-1.0, AI's confidence in its evaluation
}

interface EvaluationFeedback {
  summary: string;                         // 1-3 sentence overall assessment
  perQuestion: QuestionEvaluation[];
  revisionRecommendations: string[];       // 2-5 actionable suggestions
  strengths: string[];                     // 1-3 things done well
}

interface QuestionEvaluation {
  questionIndex: number;
  correct: boolean;
  pointsAwarded: number;
  pointsPossible: number;
  explanation: string;
  conceptTested: string;
}
```

---

## Claude API Interaction Details

### Model Configuration

```typescript
interface ClaudeApiConfig {
  model: string;            // e.g. "claude-sonnet-4-20250514"
  maxTokens: number;        // 4096 for generation, 4096 for evaluation
  temperature: number;      // 0.7 for generation, 0.3 for evaluation
  timeoutMs: number;        // 30000 (30 seconds)
}
```

### Prompt Strategy

- System prompt defines the AI role ("You are an expert educator...") and output format (strict JSON).
- User prompt contains the topic details, mode instructions, and desired question count.
- The response must be valid JSON conforming to the output shapes above.
- Use Claude's JSON output mode / structured output if available; otherwise parse and validate the response.

### Response Parsing

```typescript
// Pseudocode for parsing AI response
function parseAiResponse<T>(raw: string, schema: ZodSchema<T>): T {
  // 1. Extract JSON from response (handle markdown code blocks)
  // 2. JSON.parse()
  // 3. Validate against Zod schema
  // 4. Throw AiMalformedResponseError on any failure
}
```

---

## Error Types

```typescript
class AiServiceError extends Error {
  constructor(
    message: string,
    public readonly code: AiErrorCode,
    public readonly retryable: boolean,
    public readonly cause?: Error,
  ) {
    super(message);
  }
}

enum AiErrorCode {
  TIMEOUT = 'AI_TIMEOUT',
  RATE_LIMITED = 'AI_RATE_LIMITED',
  MALFORMED_RESPONSE = 'AI_MALFORMED_RESPONSE',
  INVALID_API_KEY = 'AI_INVALID_API_KEY',
  MODEL_OVERLOADED = 'AI_MODEL_OVERLOADED',
  CONTENT_FILTERED = 'AI_CONTENT_FILTERED',
  UNKNOWN = 'AI_UNKNOWN',
}
```

### Error Handling Matrix

| Scenario                  | AiErrorCode           | Retryable | BullMQ Behavior                  |
|---------------------------|-----------------------|-----------|----------------------------------|
| Request exceeds 30s       | `AI_TIMEOUT`          | yes       | Retry up to 3 times, backoff 5s  |
| Claude 429 response       | `AI_RATE_LIMITED`     | yes       | Retry up to 3 times, backoff 30s |
| Response is not valid JSON | `AI_MALFORMED_RESPONSE` | yes     | Retry up to 2 times, backoff 5s  |
| JSON valid but wrong shape | `AI_MALFORMED_RESPONSE` | yes     | Retry up to 2 times, backoff 5s  |
| Invalid API key (401)     | `AI_INVALID_API_KEY`  | no        | Fail immediately, log alert      |
| Claude 529 overloaded     | `AI_MODEL_OVERLOADED` | yes       | Retry up to 3 times, backoff 60s |
| Content filter triggered  | `AI_CONTENT_FILTERED` | no        | Fail, set Assessment.status=FAILED |
| Any other error           | `AI_UNKNOWN`          | no        | Fail, log full error             |

### BullMQ Job Configuration

```typescript
// assessment-generation queue
const generationJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000, // 5s base, then 10s, 20s
  },
  removeOnComplete: 100,
  removeOnFail: 200,
};

// assessment-evaluation queue
const evaluationJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: 100,
  removeOnFail: 200,
};
```

### Job Payloads

```typescript
interface GenerationJobData {
  assessmentId: string;
  userId: string;
  params: GenerateAssessmentParams;
}

interface EvaluationJobData {
  assessmentId: string;
  userId: string;
  params: EvaluateAnswersParams;
}
```

### Job Processor Flow

**Generation Job**:
1. Call `aiService.generateAssessment(params)`
2. On success: store `questions` JSON, set `status = READY`
3. On non-retryable failure: set `status = FAILED`, store `errorMessage`
4. On retryable failure: throw to trigger BullMQ retry

**Evaluation Job**:
1. Call `aiService.evaluateAnswers(params)`
2. On success:
   a. Store `score`, `maxScore`, `feedback`, `weakConcepts`, `confidenceScore`
   b. Set `status = EVALUATED`
   c. Compute SM-2 quality and upsert `ReviewSchedule` (see spaced-repetition.md)
   d. If `quality < 3`: create follow-up revision items
3. On failure: same pattern as generation job

---

## Module Dependency Graph

```
AssessmentModule
  ├── imports: AiModule, PrismaModule, BullModule.registerQueue('assessment')
  ├── AssessmentController
  ├── AssessmentService
  ├── GenerationJobProcessor
  └── EvaluationJobProcessor

AiModule
  ├── exports: AiService
  └── AiService (wraps Claude SDK)

SpacedRepetitionModule
  ├── imports: PrismaModule
  ├── SpacedRepetitionController
  └── SpacedRepetitionService

// No circular dependencies:
// AssessmentModule -> AiModule (one-way)
// EvaluationJobProcessor calls SpacedRepetitionService directly
//   OR: EvaluationJobProcessor emits event, SpacedRepetitionModule listens
//   Recommendation: direct import is simpler for single-user app.
//   SpacedRepetitionModule exports SpacedRepetitionService,
//   AssessmentModule imports SpacedRepetitionModule.
```
