# Self-Study Web App Blueprint (React + NestJS)

## 1) Product scope
This document provides an implementation-ready blueprint for your personal learning platform with:
- Backlog → Monthly → Weekly → Daily planning
- Kanban board (Trello/Jira-style)
- AI-powered assessments using Claude
- Spaced repetition scheduling based on assessment scores
- Progress analytics (day/week/month/quarter/year)
- Library tracking (books/videos)
- Time tracking
- Category-based progression and role roadmap tracking (e.g., Senior QA Engineer)

---

## 2) Recommended stack

### Frontend (React)
- React + TypeScript (Vite)
- React Router
- Zustand (or Redux Toolkit)
- TanStack Query for API data
- dnd-kit for Kanban drag-and-drop
- shadcn/ui (or MUI) for UI components
- Recharts (or Nivo) for analytics

### Backend (NestJS)
- NestJS + TypeScript
- Prisma ORM + PostgreSQL
- Redis + BullMQ for async AI jobs
- JWT auth + refresh tokens
- Swagger/OpenAPI
- Zod DTO validation (optional but useful)

> **Personal-use simplification:** Since this is a single-user personal app, full JWT auth with refresh tokens may be overkill for Phase 1. Consider starting with a simple environment-variable-based password or session cookie approach. JWT can be introduced later if multi-user support or mobile API access becomes needed.

### Integrations
- Anthropic Claude API (assessment generation/evaluation)
- Optional S3-compatible storage for notes/files

---

## 3) Core domain model (Prisma schema draft)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum PlanLevel {
  BACKLOG
  MONTHLY
  WEEKLY
  DAILY
}

enum LearnStatus {
  TO_LEARN
  PLANNED
  IN_PROGRESS
  LEARNED
  NEEDS_REVISION
  ARCHIVED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum AssessmentMode {
  QUIZ
  QA
  TASK
  FLASHCARD
  TEACH_BACK
  BUG_ANALYSIS
}

enum ResourceType {
  BOOK
  VIDEO
  ARTICLE
  LINK
}

enum RoleSkillStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
}

enum ReminderType {
  SPACED_REVIEW
  DAILY_PLAN
  STUDY_STREAK
  CUSTOM
}

model User {
  id              String            @id @default(cuid())
  email           String            @unique
  passwordHash    String
  name            String?
  timezone        String            @default("UTC")
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  categories      Category[]
  learningItems   LearningItem[]
  planAssignments PlanAssignment[]
  assessments     Assessment[]
  assessmentRuns  AssessmentRun[]
  studySessions   StudySession[]
  resources       Resource[]
  resourceSessions ResourceSession[]
  roadmaps        RoleRoadmap[]
  spacedRepetitions SpacedRepetition[]
  reminders       Reminder[]
}

model Category {
  id         String         @id @default(cuid())
  userId     String
  name       String
  color      String?
  weightGoal Int?           // optional target share (% or relative)
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt

  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  learningItems LearningItem[]

  @@unique([userId, name])
}

model LearningItem {
  id               String         @id @default(cuid())
  userId           String
  categoryId       String?
  title            String
  description      String?
  notes            String?
  priority         Priority       @default(MEDIUM)
  difficulty       Int            @default(3)
  estimatedHours   Float?
  status           LearnStatus    @default(TO_LEARN)
  dueDate          DateTime?
  targetRole       String?
  tags             String[]
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  user             User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  category         Category?      @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  plans            PlanAssignment[]
  assessments      Assessment[]
  studySessions    StudySession[]
  roleSkills       RoleSkill[]
  spacedRepetitions SpacedRepetition[]
  reminders        Reminder[]
}

model PlanAssignment {
  id             String       @id @default(cuid())
  userId         String
  learningItemId String
  level          PlanLevel
  periodKey      String       // e.g. 2026-03, 2026-W11, 2026-03-17
  rank           Int          @default(0)
  createdAt      DateTime     @default(now())

  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  learningItem   LearningItem @relation(fields: [learningItemId], references: [id], onDelete: Cascade)

  @@index([userId, level, periodKey])
}

model Assessment {
  id               String         @id @default(cuid())
  userId           String
  learningItemId   String
  mode             AssessmentMode
  difficulty       Int            @default(3)
  promptComment    String?
  generatedPayload Json
  createdAt        DateTime       @default(now())

  user             User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  learningItem     LearningItem   @relation(fields: [learningItemId], references: [id], onDelete: Cascade)
  runs             AssessmentRun[]
}

model AssessmentRun {
  id                String      @id @default(cuid())
  userId            String
  assessmentId      String
  answersPayload    Json
  score             Float?
  strengths         String[]
  gaps              String[]
  recommendations   String[]
  rawEvaluation     Json?
  createdAt         DateTime    @default(now())

  user              User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  assessment        Assessment  @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  spacedRepetition  SpacedRepetition?
}

model StudySession {
  id             String       @id @default(cuid())
  userId         String
  learningItemId String?
  startedAt      DateTime
  endedAt        DateTime?
  durationMin    Int?
  note           String?
  createdAt      DateTime     @default(now())

  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  learningItem   LearningItem? @relation(fields: [learningItemId], references: [id], onDelete: SetNull)
}

model SpacedRepetition {
  id               String       @id @default(cuid())
  userId           String
  learningItemId   String
  assessmentRunId  String?      @unique
  nextReviewAt     DateTime
  intervalDays     Int          @default(1)
  easeFactor       Float        @default(2.5)
  reviewCount      Int          @default(0)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  user             User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  learningItem     LearningItem @relation(fields: [learningItemId], references: [id], onDelete: Cascade)
  assessmentRun    AssessmentRun? @relation(fields: [assessmentRunId], references: [id], onDelete: SetNull)

  @@index([userId, nextReviewAt])
}

model Reminder {
  id               String       @id @default(cuid())
  userId           String
  learningItemId   String?
  type             ReminderType
  message          String?
  scheduledAt      DateTime
  dismissed        Boolean      @default(false)
  createdAt        DateTime     @default(now())

  user             User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  learningItem     LearningItem? @relation(fields: [learningItemId], references: [id], onDelete: SetNull)

  @@index([userId, dismissed, scheduledAt])
}

model Resource {
  id              String        @id @default(cuid())
  userId          String
  type            ResourceType
  title           String
  pathOrUrl       String
  totalPages      Int?
  totalSeconds    Int?
  lastPage        Int?
  lastSecond      Int?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessions        ResourceSession[]
}

model ResourceSession {
  id             String      @id @default(cuid())
  userId         String
  resourceId     String
  startedAt      DateTime
  endedAt        DateTime?
  fromPage       Int?
  toPage         Int?
  fromSecond     Int?
  toSecond       Int?
  notes          String?
  createdAt      DateTime    @default(now())

  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  resource       Resource    @relation(fields: [resourceId], references: [id], onDelete: Cascade)
}

model RoleRoadmap {
  id            String            @id @default(cuid())
  userId        String
  roleName      String
  createdAt     DateTime          @default(now())

  user          User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  skills        RoleSkill[]
}

model RoleSkill {
  id            String            @id @default(cuid())
  roadmapId     String
  learningItemId String?
  name          String
  status        RoleSkillStatus   @default(NOT_STARTED)

  roadmap       RoleRoadmap       @relation(fields: [roadmapId], references: [id], onDelete: Cascade)
  learningItem  LearningItem?     @relation(fields: [learningItemId], references: [id], onDelete: SetNull)
}
```

---

## 4) NestJS module and endpoint map

### AuthModule
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### CategoryModule
- `GET /categories`
- `POST /categories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`

### LearningItemsModule
- `GET /learning-items?status=&categoryId=&search=`
- `POST /learning-items`
- `GET /learning-items/:id`
- `PATCH /learning-items/:id`
- `DELETE /learning-items/:id`
- `POST /learning-items/:id/move-status`

### PlanningModule
- `POST /planning/assign` (assign backlog item to monthly/weekly/daily)
- `POST /planning/auto-distribute` (split weekly items across working days)
- `GET /planning/month/:yyyyMM`
- `GET /planning/week/:yyyyWww`
- `GET /planning/day/:yyyyMMdd`
- `PATCH /planning/reorder`

### BoardModule
- `GET /board/today`
- `GET /board/week`
- `PATCH /board/drag` (kanban movement)

### AssessmentModule
- `POST /assessments/generate` (topic + mode + comment => Claude prompt)
- `POST /assessments/:id/submit` (answers)
- `GET /assessments/:id/results`
- `GET /assessments/history?learningItemId=`

### SpacedRepetitionModule
- `GET /spaced-repetition/due` (items due for review today)
- `POST /spaced-repetition/review` (record a review, update interval)
- `GET /spaced-repetition/schedule` (upcoming review calendar)

### AI Module
- `POST /ai/evaluate` (internal)
- queue processor for generation/evaluation jobs

### TimeTrackingModule
- `POST /time/sessions/start`
- `POST /time/sessions/:id/stop`
- `POST /time/sessions/manual`
- `GET /time/sessions?from=&to=`

### LibraryModule
- `GET /library/resources`
- `POST /library/resources` (book/video/link)
- `PATCH /library/resources/:id/progress`
- `POST /library/resources/:id/sessions`
- `GET /library/resources/:id/sessions`

### ReminderModule
- `GET /reminders?dismissed=false` (active reminders)
- `POST /reminders` (create custom reminder)
- `PATCH /reminders/:id/dismiss`

### StatsModule
- `GET /stats/day?date=YYYY-MM-DD`
- `GET /stats/week?week=YYYY-Www`
- `GET /stats/month?month=YYYY-MM`
- `GET /stats/quarter?quarter=YYYY-QN`
- `GET /stats/year?year=YYYY`
- `GET /stats/role-progress/:roadmapId`
- `GET /stats/category-progress`

---

## 5) React app page/component structure

### Pages
- `/dashboard` → Today focus, active timers, quick actions, spaced repetition items due today
- `/backlog` → all future topics (filters/tags)
- `/planner/month`
- `/planner/week`
- `/planner/day`
- `/board` → Kanban board (To Learn / Planned / In Progress / Learned / Needs Revision)
- `/assessments` → create test, answer, history
- `/statistics` → all analytics views
- `/library` → books/videos/cards and progress
- `/roadmap` → role skill tree (e.g., Senior QA)
- `/settings`

### Component outline
- `LearningItemForm`
- `PlanBucketSelector` (monthly/weekly/daily)
- `KanbanBoard`, `KanbanColumn`, `LearningCard`
- `AssessmentWizard`, `AssessmentPlayer`, `AssessmentResultPanel`
- `StatsFilters`, `ProgressCharts`, `HeatmapCalendar`
- `ResourceCard`, `ReadingProgressEditor`, `VideoProgressEditor`
- `TimerWidget`, `PomodoroControls`
- `SpacedRepetitionDueList`, `ReviewScheduleCalendar`
- `ReminderBanner`, `ReminderList`

---

## 6) Claude prompt templates

### A) Quiz generation
```
You are an expert coach helping a learner master: {{topic}}.

Generate {{count}} multiple-choice questions.
Difficulty: {{difficulty}}/5.
Learner context: {{contextComment}}.

Requirements:
- Return strict JSON.
- Each question has: id, question, options[4], correctOptionIndex, explanation, skillTag.
- Include at least 30% scenario-based questions.
- Keep questions practical for {{targetRole}}.
```

### B) Open Q&A evaluation
```
Evaluate learner answers for topic: {{topic}}.

Input JSON:
- questions
- learnerAnswers
- expectedCoverage

Return strict JSON:
- score (0-100)
- strengths[]
- gaps[]
- missedConcepts[]
- recommendedNextTopics[]
- feedbackByQuestion[]
```

### C) Practical task generation
```
Create {{count}} practical tasks for topic {{topic}}.
Difficulty {{difficulty}}/5.
Role: {{targetRole}}.

Return strict JSON with:
- taskId
- taskTitle
- scenario
- acceptanceCriteria[]
- rubric (0-5 with dimensions)
- expectedSolutionOutline
```

### D) Flashcard generation
```
You are an expert coach helping a learner master: {{topic}}.

Generate {{count}} flashcards for spaced repetition review.
Difficulty: {{difficulty}}/5.
Learner context: {{contextComment}}.

Requirements:
- Return strict JSON.
- Each flashcard has: id, front (question/term), back (answer/definition), hint (optional), skillTag.
- Mix recall types: definitions, comparisons, application scenarios.
- Keep content practical for {{targetRole}}.
```

### E) Bug analysis challenge
```
You are a QA engineering mentor. Create {{count}} bug analysis challenges for topic: {{topic}}.
Difficulty: {{difficulty}}/5.
Role: {{targetRole}}.

Requirements:
- Return strict JSON.
- Each challenge has: id, scenario (description of a system/feature), buggyBehavior (what went wrong), logs (optional supporting data), expectedAnswer (root cause + fix), rubric (scoring dimensions), skillTag.
- Include realistic production-like scenarios.
- Vary between functional bugs, performance issues, and edge cases.
```

### F) Teach-back evaluation
```
Evaluate a learner's teach-back explanation for topic: {{topic}}.

The learner was asked to explain the concept as if teaching a junior colleague.

Input JSON:
- topic
- learnerExplanation
- expectedKeyConcepts[]

Return strict JSON:
- clarityScore (0-100)
- completenessScore (0-100)
- accuracyScore (0-100)
- overallScore (0-100)
- strengths[]
- missingConcepts[]
- inaccuracies[]
- improvementSuggestions[]
- feedbackNarrative (2-3 sentences of constructive feedback)
```

---

## 7) UX decisions that make this app easy to use
- Daily home screen defaults to "What should I learn today?"
- One-click convert: Backlog → Month → Week → Day
- Quick-add modal (title + category + estimate in under 10 seconds)
- Smart auto-distribution (e.g., 20 topics / 5 days)
- Automatic carry-over for unfinished daily tasks
- Color semantics per category + difficulty badges
- Keyboard shortcuts for power usage
- Mobile layout prioritizing today list and timer
- Spaced repetition banner on dashboard showing due items

---

## 8) Improvement ideas beyond MVP
1. Confidence tracking slider before/after each topic.
2. Weekly reflection generator (wins, blockers, plan corrections).
3. Burnout safety: suggest lighter day when overload detected.
4. Habit streaks + consistency badges.
5. Goal templates (e.g., "Senior QA in 6 months").
6. Smart dependency graph (learn API testing before advanced framework).

---

## 9) Suggested phased delivery

### Phase 1 (2-3 weeks)
- Auth (simplified for personal use), backlog CRUD, category CRUD
- Month/week/day planning + today widget
- Kanban board + drag/drop
- Basic timer + sessions
- Basic stats

### Phase 2 (2-3 weeks)
- Claude quiz generation + submission + results
- Q&A, practical task, flashcard, bug analysis, and teach-back modes
- Score history + weak area recommendations
- Spaced repetition scheduling
- Category analytics

### Phase 3 (2-3 weeks)
- Library (books/videos) with progress sessions
- Advanced analytics (heatmaps, radar, forecast)
- Role roadmap + category target balancing
- Reminders and notifications

---

## 10) Minimal API contract examples

### Create learning item
`POST /learning-items`
```json
{
  "title": "API test design techniques",
  "description": "Boundary value analysis and pairwise",
  "categoryId": "cat_automation",
  "priority": "MEDIUM",
  "difficulty": 3,
  "estimatedHours": 4,
  "tags": ["qa", "api", "testing"]
}
```

### Generate assessment
`POST /assessments/generate`
```json
{
  "learningItemId": "li_123",
  "mode": "QUIZ",
  "difficulty": 3,
  "questionCount": 10,
  "promptComment": "Focus on real QA scenarios"
}
```

### Submit assessment answers
`POST /assessments/:id/submit`
```json
{
  "answers": [
    { "questionId": "q1", "selected": 2 },
    { "questionId": "q2", "selected": 1 }
  ]
}
```

### Record spaced repetition review
`POST /spaced-repetition/review`
```json
{
  "learningItemId": "li_123",
  "assessmentRunId": "ar_456",
  "score": 85
}
```
Response: `{ "nextReviewAt": "2026-03-24", "intervalDays": 7 }`

---

## 11) Seed data and migration strategy

### Default seed data (prisma/seed.ts)
Run with `npx prisma db seed` after initial migration.

**Default categories:**
- Theory (color: #3B82F6)
- Automation (color: #10B981)
- Mindset (color: #F59E0B)
- Soft Skills (color: #8B5CF6)
- Tools & Infrastructure (color: #EF4444)

**Sample role roadmap:** Senior QA Engineer with skills:
- Test strategy & planning
- API testing
- UI automation (Playwright/Cypress)
- Performance testing
- CI/CD & DevOps for QA
- Security testing basics
- Test architecture & frameworks
- Mentoring & leadership

**Sample learning items:** 3-5 starter items in different categories to demonstrate the workflow.

### Migration strategy
- Use Prisma Migrate (`npx prisma migrate dev`) for schema changes
- Keep migration files in version control
- Seed script should be idempotent (check before insert)

---

## 12) Recommended next action
Start by implementing **Phase 1** and keep AI assessments as asynchronous jobs. This gives immediate user value (planning + execution + tracking) while you prepare robust AI evaluation flows.
