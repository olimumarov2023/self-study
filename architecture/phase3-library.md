# Phase 3: Library Module -- Data Model & API Contracts

All endpoints require `Authorization: Bearer <jwt>`.
User ID is extracted from the JWT via `@CurrentUser()` decorator.

Ref: requirements/summary.txt section 2.7

---

## 1. Enums

```typescript
enum ResourceType {
  BOOK = 'BOOK',
  VIDEO = 'VIDEO',
}

enum ResourceStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
}
```

---

## 2. Prisma Schema Additions

```prisma
enum ResourceType {
  BOOK
  VIDEO
}

enum ResourceStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  ON_HOLD
}

model LibraryResource {
  id             String         @id @default(cuid())
  userId         String
  type           ResourceType
  status         ResourceStatus @default(NOT_STARTED)
  title          String
  author         String?
  url            String?                              // YouTube link, local path, etc.
  totalPages     Int?                                 // BOOK only
  totalSeconds   Int?                                 // VIDEO only, stored as integer seconds
  coverUrl       String?                              // thumbnail / cover image URL
  notes          String?                              // general notes about the resource
  tags           String[]
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  user     User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessions ResourceSession[]

  @@index([userId, type])
  @@index([userId, status])
}

model ResourceSession {
  id                String   @id @default(cuid())
  libraryResourceId String
  startPage         Int?                              // BOOK: first page read this session
  endPage           Int?                              // BOOK: last page read this session
  startSeconds      Int?                              // VIDEO: playback start in seconds
  endSeconds        Int?                              // VIDEO: playback end in seconds
  note              String?                           // session-level notes / highlights
  sessionDate       DateTime @default(now())          // when the session occurred
  createdAt         DateTime @default(now())

  resource LibraryResource @relation(fields: [libraryResourceId], references: [id], onDelete: Cascade)

  @@index([libraryResourceId, sessionDate])
}
```

### User model addition

Add to the existing `User` model:

```prisma
model User {
  // ... existing fields ...
  libraryResources  LibraryResource[]
}
```

### Validation constraints (enforced at DTO level, not Prisma)

| Field | Rule |
|-------|------|
| `totalPages` | Required when `type = BOOK`. Must be > 0. |
| `totalSeconds` | Required when `type = VIDEO`. Must be > 0. |
| `startPage` / `endPage` | Required when resource `type = BOOK`. `endPage >= startPage`. Both > 0, both <= `totalPages`. |
| `startSeconds` / `endSeconds` | Required when resource `type = VIDEO`. `endSeconds >= startSeconds`. Both >= 0, both <= `totalSeconds`. |

---

## 3. NestJS Module Structure

```
backend/src/library/
  library.module.ts
  library.controller.ts
  library.service.ts
  dto/
    create-library-resource.dto.ts
    update-library-resource.dto.ts
    create-resource-session.dto.ts
    library-resource-query.dto.ts
    library-resource-response.dto.ts
    resource-session-response.dto.ts
```

The module imports `PrismaModule` only. No cross-module dependencies.

---

## 4. DTO Definitions

### 4.1 CreateLibraryResourceDto

```typescript
import { z } from 'zod';

export const CreateLibraryResourceSchema = z
  .object({
    type: z.enum(['BOOK', 'VIDEO']),
    title: z.string().min(1).max(500),
    author: z.string().max(255).optional(),
    url: z.string().url().max(2000).optional(),
    totalPages: z.number().int().positive().optional(),
    totalSeconds: z.number().int().positive().optional(),
    coverUrl: z.string().url().max(2000).optional(),
    notes: z.string().max(5000).optional(),
    tags: z.array(z.string().max(50)).max(20).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'BOOK' && data.totalPages == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'totalPages is required for BOOK resources',
        path: ['totalPages'],
      });
    }
    if (data.type === 'VIDEO' && data.totalSeconds == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'totalSeconds is required for VIDEO resources',
        path: ['totalSeconds'],
      });
    }
  });

export type CreateLibraryResourceDto = z.infer<typeof CreateLibraryResourceSchema>;
```

### 4.2 UpdateLibraryResourceDto

```typescript
import { z } from 'zod';

export const UpdateLibraryResourceSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  author: z.string().max(255).optional(),
  url: z.string().url().max(2000).optional(),
  totalPages: z.number().int().positive().optional(),
  totalSeconds: z.number().int().positive().optional(),
  coverUrl: z.string().url().max(2000).optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).optional(),
});

export type UpdateLibraryResourceDto = z.infer<typeof UpdateLibraryResourceSchema>;
```

### 4.3 LibraryResourceQueryDto

```typescript
import { z } from 'zod';

export const LibraryResourceQuerySchema = z.object({
  type: z.enum(['BOOK', 'VIDEO']).optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).optional(),
  search: z.string().max(255).optional(),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type LibraryResourceQueryDto = z.infer<typeof LibraryResourceQuerySchema>;
```

### 4.4 CreateResourceSessionDto

```typescript
import { z } from 'zod';

export const CreateResourceSessionSchema = z
  .object({
    startPage: z.number().int().positive().optional(),
    endPage: z.number().int().positive().optional(),
    startSeconds: z.number().int().min(0).optional(),
    endSeconds: z.number().int().min(0).optional(),
    note: z.string().max(5000).optional(),
    sessionDate: z.string().datetime().optional(), // ISO 8601; defaults to now() on server
  })
  .superRefine((data, ctx) => {
    // Book fields: both or neither
    const hasBookFields = data.startPage != null || data.endPage != null;
    const hasVideoFields = data.startSeconds != null || data.endSeconds != null;

    if (hasBookFields && hasVideoFields) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cannot mix page and timestamp fields in one session',
        path: [],
      });
    }

    if (hasBookFields) {
      if (data.startPage == null || data.endPage == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Both startPage and endPage are required for book sessions',
          path: [],
        });
      } else if (data.endPage < data.startPage) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'endPage must be >= startPage',
          path: ['endPage'],
        });
      }
    }

    if (hasVideoFields) {
      if (data.startSeconds == null || data.endSeconds == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Both startSeconds and endSeconds are required for video sessions',
          path: [],
        });
      } else if (data.endSeconds < data.startSeconds) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'endSeconds must be >= startSeconds',
          path: ['endSeconds'],
        });
      }
    }
  });

export type CreateResourceSessionDto = z.infer<typeof CreateResourceSessionSchema>;
```

### 4.5 Response Types

```typescript
// library-resource-response.dto.ts

export interface ResourceSessionResponseDto {
  id: string;
  startPage: number | null;
  endPage: number | null;
  startSeconds: number | null;
  endSeconds: number | null;
  note: string | null;
  sessionDate: string; // ISO 8601
  createdAt: string;
}

export interface ResumePositionDto {
  /** For BOOK: next page number to read. For VIDEO: next second to play from. Null if no sessions. */
  type: 'page' | 'timestamp' | null;
  /** BOOK: page number. VIDEO: seconds. */
  value: number | null;
  /** Human-readable label: "Resume from page 31" or "Resume from 12:34" */
  label: string | null;
}

export interface LibraryResourceResponseDto {
  id: string;
  type: 'BOOK' | 'VIDEO';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  title: string;
  author: string | null;
  url: string | null;
  totalPages: number | null;
  totalSeconds: number | null;
  coverUrl: string | null;
  notes: string | null;
  tags: string[];
  /** Percentage complete: 0-100, computed from sessions. */
  progressPercent: number;
  /** Resume position computed from latest session. Included on detail endpoint. */
  resumePosition: ResumePositionDto | null;
  /** Total sessions logged. */
  sessionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryResourceListResponseDto {
  data: LibraryResourceResponseDto[];
  total: number;
  page: number;
  limit: number;
}
```

---

## 5. REST API Contracts

### 5.1 GET /library

List all resources for the authenticated user with optional filters.

**Query parameters:** `LibraryResourceQueryDto`

**Response: 200 OK**

```json
{
  "data": [LibraryResourceResponseDto],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

Note: List items return `resumePosition: null`. Use the detail endpoint for resume info.
`progressPercent` and `sessionCount` are always included.

---

### 5.2 POST /library

Create a new library resource.

**Request body:** `CreateLibraryResourceDto`

**Response: 201 Created** -> `LibraryResourceResponseDto`

**Errors:**

| Status | Condition |
|--------|-----------|
| 400 | Validation error (missing totalPages for BOOK, etc.) |

---

### 5.3 GET /library/:id

Get a single resource with full detail including resume position and latest session.

**Path params:** `id` (cuid)

**Response: 200 OK** -> `LibraryResourceResponseDto`

The `resumePosition` field is populated on this endpoint. See section 6 for computation logic.

**Errors:**

| Status | Condition |
|--------|-----------|
| 404 | Resource not found or belongs to another user |

---

### 5.4 PATCH /library/:id

Update resource metadata or status.

**Path params:** `id` (cuid)

**Request body:** `UpdateLibraryResourceDto`

**Response: 200 OK** -> `LibraryResourceResponseDto`

**Errors:**

| Status | Condition |
|--------|-----------|
| 400 | Validation error |
| 404 | Resource not found or belongs to another user |

**Side effect:** If `status` is changed to `COMPLETED`, no automatic action. The user can manually mark completion regardless of session progress.

---

### 5.5 DELETE /library/:id

Delete a resource and all its sessions (cascade).

**Path params:** `id` (cuid)

**Response: 204 No Content**

**Errors:**

| Status | Condition |
|--------|-----------|
| 404 | Resource not found or belongs to another user |

---

### 5.6 GET /library/:id/sessions

List all sessions for a resource, ordered by `sessionDate` descending.

**Path params:** `id` (cuid)

**Query params:**

```typescript
{
  page?: number;  // default 1
  limit?: number; // default 50, max 100
}
```

**Response: 200 OK**

```json
{
  "data": [ResourceSessionResponseDto],
  "total": 15,
  "page": 1,
  "limit": 50
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| 404 | Resource not found or belongs to another user |

---

### 5.7 POST /library/:id/sessions

Log a new reading/watching session.

**Path params:** `id` (cuid)

**Request body:** `CreateResourceSessionDto`

**Response: 201 Created** -> `ResourceSessionResponseDto`

**Additional validation (service-level):**

- If resource type is `BOOK`, request must contain `startPage` and `endPage` (not timestamp fields).
- If resource type is `VIDEO`, request must contain `startSeconds` and `endSeconds` (not page fields).
- `endPage` must not exceed `resource.totalPages`.
- `endSeconds` must not exceed `resource.totalSeconds`.

**Side effects:**

1. If `resource.status` is `NOT_STARTED`, automatically update to `IN_PROGRESS`.
2. If progress reaches 100% (see section 6), automatically update status to `COMPLETED`.

**Errors:**

| Status | Condition |
|--------|-----------|
| 400 | Validation error, field type mismatch with resource type, values exceed total |
| 404 | Resource not found or belongs to another user |

---

## 6. Resume Position & Progress Computation

### 6.1 Resume position

The resume position is derived from sessions, not stored as a column. It is computed at query time in the service layer.

**Algorithm for BOOK:**

```
1. Query all sessions for the resource, ordered by endPage DESC.
2. resumeValue = max(endPage) + 1 across all sessions.
3. If resumeValue > totalPages, clamp to totalPages (resource is fully read).
4. label = "Resume from page {resumeValue}"
5. type = "page"
```

**Algorithm for VIDEO:**

```
1. Query all sessions for the resource, ordered by endSeconds DESC.
2. resumeValue = max(endSeconds) across all sessions.
   (Unlike books, video resumes AT the last endpoint since the user
    may want to re-watch the transition point.)
3. If resumeValue >= totalSeconds, clamp to totalSeconds.
4. label = "Resume from {MM:SS}" where MM:SS = formatSeconds(resumeValue)
5. type = "timestamp"
```

**Edge case:** If no sessions exist, all three fields (`type`, `value`, `label`) are `null`.

### 6.2 Progress percent

**BOOK:**

```
pages read = union of all [startPage, endPage] intervals (handle overlaps)
progressPercent = floor((pages read / totalPages) * 100)
```

The overlap-aware calculation uses interval merging:

```
1. Collect all [startPage, endPage] pairs.
2. Sort by startPage ascending.
3. Merge overlapping intervals: if current.start <= prev.end + 1, merge.
4. Sum the lengths of merged intervals: for each [s, e], count = e - s + 1.
5. progressPercent = floor((totalCovered / totalPages) * 100)
```

**VIDEO:**

```
seconds watched = union of all [startSeconds, endSeconds] intervals (handle overlaps)
progressPercent = floor((seconds watched / totalSeconds) * 100)
```

Same interval-merging algorithm, using seconds instead of pages.

**Why interval merging:** Users may re-read pages or re-watch segments. Without merging, progress could exceed 100%. Merging gives an accurate unique-coverage metric.

### 6.3 Time formatting helper

For the resume label and any UI display of video positions:

```typescript
function formatSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
```

This is a utility function, not a DTO. Place it in `backend/src/library/library.utils.ts`.

---

## 7. Design Decisions & Trade-offs

### 7.1 Computed progress vs. stored column

**Decision:** Compute `progressPercent` and `resumePosition` at query time.

**Reasoning:** Session data is the source of truth. Storing a denormalized progress column introduces staleness risk (e.g., if a session is deleted, the progress column must be recomputed). The number of sessions per resource is expected to be small (tens, not thousands), so the interval-merge computation is negligible. If performance becomes an issue later, a materialized `lastPage`/`lastSecond` column can be added as a cache.

### 7.2 Seconds as integers vs. string timestamps

**Decision:** Store video positions as `Int` (seconds), not as `String` ("MM:SS") or `Float`.

**Reasoning:** Integer arithmetic is simpler for range comparisons, interval merging, and progress calculation. The `formatSeconds` utility handles display. Sub-second precision is unnecessary for a tracking app.

### 7.3 Session-level notes vs. resource-level notes

**Decision:** Both. `LibraryResource.notes` holds general notes about the resource. `ResourceSession.note` holds session-specific highlights or annotations.

**Reasoning:** Requirements specify "Notes and highlights per session" and a "Convert note to backlog topic" button. Session notes serve the per-session use case; resource notes serve as a general scratchpad.

### 7.4 No `learningItemId` foreign key on LibraryResource

**Decision:** Library resources are independent of learning items.

**Reasoning:** A book or video is a resource, not a skill to learn. A user might read a book that covers multiple learning items, or have learning items with no associated resource. Linking them would create a tight coupling. If a "Convert note to backlog topic" feature is needed, it creates a new `LearningItem` via a separate endpoint (future scope, not part of this contract).

---

## 8. Endpoint Summary Table

| Method | Path | Request Body | Response | Status Codes |
|--------|------|-------------|----------|-------------|
| GET | `/library` | -- (query params) | `LibraryResourceListResponseDto` | 200 |
| POST | `/library` | `CreateLibraryResourceDto` | `LibraryResourceResponseDto` | 201, 400 |
| GET | `/library/:id` | -- | `LibraryResourceResponseDto` | 200, 404 |
| PATCH | `/library/:id` | `UpdateLibraryResourceDto` | `LibraryResourceResponseDto` | 200, 400, 404 |
| DELETE | `/library/:id` | -- | -- | 204, 404 |
| GET | `/library/:id/sessions` | -- (query params) | `{ data, total, page, limit }` | 200, 404 |
| POST | `/library/:id/sessions` | `CreateResourceSessionDto` | `ResourceSessionResponseDto` | 201, 400, 404 |
