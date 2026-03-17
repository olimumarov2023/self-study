# Spaced Repetition API Contract

All endpoints require `Authorization: Bearer <jwt>`.
User ID is extracted from the JWT via `@CurrentUser()` decorator.

Implements SM-2 algorithm with score-to-quality mapping from assessment results.

---

## Prisma Schema Additions

```prisma
model ReviewSchedule {
  id               String     @id @default(cuid())
  userId           String
  learningItemId   String
  assessmentId     String     @unique
  easeFactor       Float      @default(2.5)  // SM-2 ease factor, min 1.3
  intervalDays     Int        @default(1)    // current interval in days
  repetitionCount  Int        @default(0)    // consecutive successful reviews
  quality          Int                       // last SM-2 quality score 0-5
  nextReviewDate   DateTime                  // computed next review date
  lastReviewedAt   DateTime                  // when assessment was evaluated
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  user             User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  learningItem     LearningItem  @relation(fields: [learningItemId], references: [id], onDelete: Cascade)
  assessment       Assessment    @relation(fields: [assessmentId], references: [id], onDelete: Cascade)

  @@index([userId, nextReviewDate])
  @@index([userId, learningItemId])
}
```

Add to `User` model: `reviewSchedules ReviewSchedule[]`
Add to `LearningItem` model: `reviewSchedules ReviewSchedule[]`

---

## SM-2 Quality Score Mapping

Assessment scores (0-100) map to SM-2 quality values (0-5):

```typescript
function mapScoreToQuality(score: number): number {
  // score: 0-100 (percentage from assessment)
  // returns: 0-5 (SM-2 quality rating)
  if (score >= 95) return 5; // perfect response
  if (score >= 80) return 4; // correct with hesitation
  if (score >= 65) return 3; // correct with serious difficulty
  if (score >= 50) return 2; // incorrect but close (triggers reset)
  if (score >= 30) return 1; // incorrect, remembered on seeing answer
  return 0;                  // complete blackout
}
```

### SM-2 Algorithm Reference

```
quality >= 3 (passing):
  if repetitionCount == 0: intervalDays = 1
  if repetitionCount == 1: intervalDays = 6
  else: intervalDays = round(intervalDays * easeFactor)

quality < 3 (failing):
  repetitionCount = 0
  intervalDays = 1

easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
easeFactor = max(easeFactor, 1.3)

nextReviewDate = today + intervalDays
```

---

## GET /spaced-repetition/due

Returns learning items due for review today or overdue.

### Query Parameters

```typescript
interface DueReviewsQuery {
  date?: string;       // ISO 8601 date (YYYY-MM-DD), defaults to today
  categoryId?: string; // optional filter
  limit?: number;      // default 50, max 100
}
```

### Response `200 OK`

```typescript
interface DueReviewsResponse {
  data: DueReviewItem[];
  meta: {
    totalDue: number;
    overdueCount: number; // items past their nextReviewDate
  };
}

interface DueReviewItem {
  reviewScheduleId: string;
  learningItemId: string;
  learningItemTitle: string;
  categoryName: string | null;
  lastScore: number;           // 0-100, from last assessment
  lastMode: AssessmentMode;    // mode of last assessment
  easeFactor: number;
  intervalDays: number;
  repetitionCount: number;
  nextReviewDate: string;      // ISO 8601
  lastReviewedAt: string;      // ISO 8601
  daysOverdue: number;         // 0 if due today, positive if overdue
}
```

### Errors

| Status | Code               | When                   |
|--------|--------------------|------------------------|
| 400    | `VALIDATION_ERROR` | Invalid query params   |
| 401    | `UNAUTHORIZED`     | Missing or invalid JWT |

---

## POST /spaced-repetition/review

Record a review result. Called automatically after assessment evaluation, but also available
for manual "I reviewed this" without a full assessment.

### Request

```typescript
interface RecordReviewDto {
  learningItemId: string;         // required
  assessmentId?: string;          // if review was via assessment
  manualQuality?: number;         // 0-5, required if no assessmentId
}
```

**Logic**:
- If `assessmentId` is provided: score and quality are derived from the assessment's evaluated score via `mapScoreToQuality()`.
- If `manualQuality` is provided (no assessment): the user self-rates their recall.
- Exactly one of `assessmentId` or `manualQuality` must be present.

### Validation Rules

| Field           | Rule                                              |
|-----------------|---------------------------------------------------|
| learningItemId  | non-empty string, must belong to user             |
| assessmentId    | optional, must exist and be in EVALUATED status   |
| manualQuality   | optional, integer 0-5                             |

### Response `200 OK`

```typescript
interface RecordReviewResponse {
  reviewScheduleId: string;
  learningItemId: string;
  quality: number;            // 0-5 SM-2 quality used
  previousInterval: number;   // days
  newInterval: number;        // days
  previousEaseFactor: number;
  newEaseFactor: number;
  repetitionCount: number;
  nextReviewDate: string;     // ISO 8601
}
```

### Errors

| Status | Code                      | When                                        |
|--------|---------------------------|---------------------------------------------|
| 400    | `VALIDATION_ERROR`        | Invalid body or both/neither assessment/manual provided |
| 401    | `UNAUTHORIZED`            | Missing or invalid JWT                      |
| 404    | `LEARNING_ITEM_NOT_FOUND` | learningItemId not found or wrong user      |
| 404    | `ASSESSMENT_NOT_FOUND`    | assessmentId not found or wrong user        |
| 409    | `ASSESSMENT_NOT_EVALUATED`| Assessment exists but status != EVALUATED   |

---

## GET /spaced-repetition/schedule

Returns upcoming review schedule for calendar display.

### Query Parameters

```typescript
interface ReviewScheduleQuery {
  startDate?: string;    // ISO 8601 date, defaults to today
  endDate?: string;      // ISO 8601 date, defaults to startDate + 30 days
  categoryId?: string;   // optional filter
  learningItemId?: string; // optional filter to single item
}
```

### Validation Rules

| Field    | Rule                                                  |
|----------|-------------------------------------------------------|
| startDate | valid ISO date                                       |
| endDate   | valid ISO date, must be >= startDate, max 90 day span |

### Response `200 OK`

```typescript
interface ReviewScheduleResponse {
  data: ScheduleEntry[];
  meta: {
    totalScheduled: number;
    dateRange: {
      start: string; // ISO 8601
      end: string;
    };
  };
}

interface ScheduleEntry {
  date: string; // ISO 8601 date (YYYY-MM-DD)
  items: ScheduleItem[];
}

interface ScheduleItem {
  reviewScheduleId: string;
  learningItemId: string;
  learningItemTitle: string;
  categoryName: string | null;
  easeFactor: number;
  intervalDays: number;
  repetitionCount: number;
}
```

### Errors

| Status | Code               | When                                        |
|--------|--------------------|---------------------------------------------|
| 400    | `VALIDATION_ERROR` | Invalid dates or range exceeds 90 days      |
| 401    | `UNAUTHORIZED`     | Missing or invalid JWT                      |

---

## Automatic Review Scheduling

When an assessment transitions to `EVALUATED` status (via the BullMQ evaluation job):

1. Compute `quality = mapScoreToQuality(assessment.score)`
2. Look up existing `ReviewSchedule` for this `learningItemId` + `userId`
   - If exists: update using SM-2 formulas above
   - If not: create new with `easeFactor = 2.5`, `repetitionCount = 0`
3. If `quality < 3` and assessment has `weakConcepts`:
   - Create follow-up `LearningItem`(s) with status `NEEDS_REVISION` and tag `auto:revision`
   - Link to original item's category

This logic runs inside the assessment evaluation job processor, not as a separate endpoint.

---

## Error Response Shape

Same format as all other modules:

```typescript
interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  timestamp: string;
}
```
