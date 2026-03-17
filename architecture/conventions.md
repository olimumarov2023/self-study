# Coding Conventions

Reference for all dev agents. Follow these rules in every file.

---

## 1. File naming

**Rule: kebab-case for all files.**

| Type | Pattern | Example |
|------|---------|---------|
| NestJS module | `<name>.module.ts` | `learning-items.module.ts` |
| NestJS controller | `<name>.controller.ts` | `learning-items.controller.ts` |
| NestJS service | `<name>.service.ts` | `learning-items.service.ts` |
| NestJS guard | `<name>.guard.ts` | `auth.guard.ts` |
| DTO | `<action>-<entity>.dto.ts` | `create-learning-item.dto.ts` |
| React page | `<name>-page.tsx` | `dashboard-page.tsx` |
| React component | `<name>.tsx` | `kanban-board.tsx` |
| React hook | `use-<name>.ts` | `use-timer.ts` |
| Zustand store | `<name>.store.ts` | `auth.store.ts` |
| API client | `<name>.api.ts` | `learning-items.api.ts` |
| TanStack query hook | `use-<name>.ts` | `use-learning-items.ts` |
| Type definition | `<name>.types.ts` | `learning-item.types.ts` |
| Utility | `<name>-utils.ts` | `date-utils.ts` |
| Test | `<name>.spec.ts` / `<name>.test.tsx` | `learning-items.service.spec.ts` |

**No `index.ts` barrel files** except `components/ui/` (shadcn convention).

---

## 2. NestJS module structure pattern

Every feature module must follow this pattern:

```typescript
// learning-items.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [LearningItemsController],
  providers: [LearningItemsService],
  exports: [LearningItemsService], // only if other modules need it
})
export class LearningItemsModule {}
```

- Controllers handle HTTP only: parse request, call service, return response.
- Services contain all business logic and Prisma calls.
- Never inject a controller into another module. Export the service if cross-module access is needed.
- Circular dependencies: use `forwardRef()` only as last resort. Prefer extracting shared logic into a separate module.

---

## 3. DTO naming and validation

**Pattern:** `<Action><Entity>Dto` as the class/type name.

```typescript
// create-learning-item.dto.ts
import { z } from 'zod';

export const CreateLearningItemSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  categoryId: z.string().cuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  difficulty: z.number().int().min(1).max(5).default(3),
  estimatedHours: z.number().positive().optional(),
  tags: z.array(z.string()).default([]),
});

export type CreateLearningItemDto = z.infer<typeof CreateLearningItemSchema>;
```

**Response DTOs:** `<Entity>ResponseDto` -- plain type, no Zod.

```typescript
// learning-item-response.dto.ts
export interface LearningItemResponseDto {
  id: string;
  title: string;
  status: LearnStatus;
  // ... all fields returned to client
}
```

**Rules:**
- Request DTOs: Zod schema + inferred type. Validated via `ZodValidationPipe`.
- Response DTOs: TypeScript interface only.
- Never expose internal fields (`passwordHash`, raw Prisma relations) in response DTOs.

---

## 4. React component naming

**Exported name: PascalCase, matching file name converted from kebab-case.**

| File | Export |
|------|--------|
| `kanban-board.tsx` | `KanbanBoard` |
| `learning-item-form.tsx` | `LearningItemForm` |
| `dashboard-page.tsx` | `DashboardPage` |

**Rules:**
- One component per file (small sub-components allowed if unexported).
- Use named exports, not default exports.
- Props type: `<ComponentName>Props`.

```typescript
// kanban-board.tsx
interface KanbanBoardProps {
  items: LearningItemResponseDto[];
  onDragEnd: (result: DragResult) => void;
}

export function KanbanBoard({ items, onDragEnd }: KanbanBoardProps) {
  // ...
}
```

---

## 5. State management conventions

### When to use Zustand

Use Zustand stores for **client-only state** that persists across navigation or is shared by unrelated components:

- `auth.store.ts` -- JWT tokens, current user, login/logout actions
- `timer.store.ts` -- active timer ID, elapsed seconds, start/stop/reset
- `ui.store.ts` -- sidebar collapsed, active modal, theme preference

**Pattern:**

```typescript
// auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: UserResponseDto | null;
  setAuth: (token: string, user: UserResponseDto) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'auth-storage' },
  ),
);
```

### When to use TanStack Query

Use TanStack Query for **all server state** -- data fetched from the API:

- Lists (learning items, categories, resources)
- Single entity detail
- Stats and analytics
- Any data that has a server-side source of truth

**Pattern:**

```typescript
// use-learning-items.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { learningItemsApi } from '../api/learning-items.api';

export const learningItemKeys = {
  all: ['learning-items'] as const,
  lists: () => [...learningItemKeys.all, 'list'] as const,
  list: (filters: LearningItemQuery) => [...learningItemKeys.lists(), filters] as const,
  detail: (id: string) => [...learningItemKeys.all, 'detail', id] as const,
};

export function useLearningItems(filters: LearningItemQuery) {
  return useQuery({
    queryKey: learningItemKeys.list(filters),
    queryFn: () => learningItemsApi.getAll(filters),
  });
}

export function useCreateLearningItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: learningItemsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningItemKeys.lists() });
    },
  });
}
```

### Decision rule

| Data source | Tool | Reason |
|-------------|------|--------|
| From API | TanStack Query | Caching, refetching, loading/error states |
| Client-only, cross-component | Zustand | No server round-trip, shared UI state |
| Component-local | `useState` / `useReducer` | No sharing needed |

---

## 6. API client conventions

Single Axios instance in `api/client.ts`:

```typescript
// api/client.ts
import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
```

Each domain API file exports plain async functions:

```typescript
// learning-items.api.ts
import { apiClient } from './client';

export const learningItemsApi = {
  getAll: (params: LearningItemQuery) =>
    apiClient.get<LearningItemResponseDto[]>('/learning-items', { params }).then(r => r.data),

  getById: (id: string) =>
    apiClient.get<LearningItemResponseDto>(`/learning-items/${id}`).then(r => r.data),

  create: (data: CreateLearningItemDto) =>
    apiClient.post<LearningItemResponseDto>('/learning-items', data).then(r => r.data),

  update: (id: string, data: UpdateLearningItemDto) =>
    apiClient.patch<LearningItemResponseDto>(`/learning-items/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/learning-items/${id}`).then(r => r.data),
};
```

---

## 7. Environment variables

### Backend (`backend/.env`)

```
DATABASE_URL=postgresql://user:password@localhost:5432/selfstudy
PORT=3000
APP_SECRET=<random-32-char-string>
JWT_SECRET=<random-64-char-string>
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-...
NODE_ENV=development
```

Validated at startup with Zod in `config/env.validation.ts`. App fails fast if any required var is missing.

### Frontend (`frontend/.env`)

```
VITE_API_URL=http://localhost:3000
```

All frontend env vars must be prefixed with `VITE_` (Vite requirement).

### `.env.example` files

Both `backend/.env.example` and `frontend/.env.example` must exist with placeholder values. Never commit actual `.env` files.

---

## 8. TypeScript strictness

### `tsconfig.base.json` (root)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

**Rules:**
- `strict: true` is non-negotiable. No `any` types except when wrapping untyped third-party libs (must add `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comment).
- Use `unknown` instead of `any` for catch blocks and external data.
- All function parameters and return types must be inferable or explicitly typed.
- No `@ts-ignore`. Use `@ts-expect-error` with explanation if absolutely necessary.

---

## 9. Import ordering

Use ESLint `import/order` rule. Enforce this order with a blank line between groups:

```typescript
// 1. Node built-ins
import { readFileSync } from 'fs';

// 2. External packages
import { Controller, Get } from '@nestjs/common';
import { z } from 'zod';

// 3. Internal aliases / absolute imports
import { PrismaService } from '../prisma/prisma.service';
import { CreateLearningItemSchema } from './dto/create-learning-item.dto';

// 4. Relative imports (parent first, then siblings)
import { LearningItemsService } from './learning-items.service';

// 5. Type-only imports (always last within their group)
import type { LearningItemResponseDto } from './dto/learning-item-response.dto';
```

**Rules:**
- Type-only imports must use `import type { ... }`.
- No circular imports. If module A and B need each other's types, extract shared types to a `types/` file or `common/types/`.

---

## 10. Additional standards

### Error response format (backend)

All API errors follow this shape:

```typescript
{
  statusCode: number;
  message: string;
  error: string;        // HTTP status text
  details?: unknown;    // validation errors array, if applicable
}
```

### API response envelope

Success responses return the data directly (no wrapper). Paginated endpoints return:

```typescript
{
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

### Git branch naming

```
feature/<module>-<description>    # feature/learning-items-crud
fix/<module>-<description>        # fix/planning-reorder-bug
chore/<description>               # chore/update-deps
```

### Commit messages

```
<type>(<scope>): <description>

feat(learning-items): add CRUD endpoints
fix(board): correct drag-drop rank calculation
chore(deps): update TanStack Query to v5
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`.
