import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const API_URL = 'http://localhost:3000';

// ── Mock data ──────────────────────────────────────────────────────────

export const mockCategories = [
  {
    id: 'cat-1',
    userId: 'user-1',
    name: 'TypeScript',
    color: '#3178c6',
    weightGoal: 30,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-2',
    userId: 'user-1',
    name: 'Testing',
    color: '#22c55e',
    weightGoal: 20,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

export const mockLearningItems = [
  {
    id: 'item-1',
    userId: 'user-1',
    categoryId: 'cat-1',
    title: 'Learn TypeScript generics',
    description: 'Deep dive into TS generics',
    notes: null,
    priority: 'HIGH',
    difficulty: 4,
    estimatedHours: 8,
    status: 'TO_LEARN',
    dueDate: null,
    targetRole: null,
    tags: ['typescript'],
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z',
    category: mockCategories[0],
  },
  {
    id: 'item-2',
    userId: 'user-1',
    categoryId: 'cat-2',
    title: 'Vitest fundamentals',
    description: 'Testing with Vitest',
    notes: null,
    priority: 'MEDIUM',
    difficulty: 3,
    estimatedHours: 4,
    status: 'IN_PROGRESS',
    dueDate: null,
    targetRole: null,
    tags: ['testing'],
    createdAt: '2026-01-12T00:00:00.000Z',
    updatedAt: '2026-01-12T00:00:00.000Z',
    category: mockCategories[1],
  },
  {
    id: 'item-3',
    userId: 'user-1',
    categoryId: null,
    title: 'React patterns',
    description: null,
    notes: null,
    priority: 'LOW',
    difficulty: 2,
    estimatedHours: null,
    status: 'LEARNED',
    dueDate: null,
    targetRole: null,
    tags: [],
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
    category: null,
  },
];

export const mockBoardResponse = {
  columns: {
    TO_LEARN: [
      {
        id: 'item-1',
        title: 'Learn TypeScript generics',
        description: 'Deep dive into TS generics',
        priority: 'HIGH',
        difficulty: 4,
        estimatedHours: 8,
        status: 'TO_LEARN',
        tags: ['typescript'],
        category: { id: 'cat-1', name: 'TypeScript', color: '#3178c6' },
        rank: 0,
      },
    ],
    PLANNED: [
      {
        id: 'item-4',
        title: 'GraphQL basics',
        description: null,
        priority: 'MEDIUM',
        difficulty: 3,
        estimatedHours: 6,
        status: 'PLANNED',
        tags: [],
        category: null,
        rank: 0,
      },
    ],
    IN_PROGRESS: [
      {
        id: 'item-2',
        title: 'Vitest fundamentals',
        description: 'Testing with Vitest',
        priority: 'MEDIUM',
        difficulty: 3,
        estimatedHours: 4,
        status: 'IN_PROGRESS',
        tags: ['testing'],
        category: { id: 'cat-2', name: 'Testing', color: '#22c55e' },
        rank: 0,
      },
    ],
    LEARNED: [
      {
        id: 'item-3',
        title: 'React patterns',
        description: null,
        priority: 'LOW',
        difficulty: 2,
        estimatedHours: null,
        status: 'LEARNED',
        tags: [],
        category: null,
        rank: 0,
      },
    ],
    NEEDS_REVISION: [],
  },
  date: '2026-03-17',
};

export const mockDayStats = {
  date: '2026-03-17',
  planned: 5,
  completed: 3,
  inProgress: 1,
  completionPct: 60,
  studyMinutes: 135,
  streak: 7,
};

export const mockWeekStats = {
  week: '2026-W12',
  planned: 12,
  completed: 8,
  inProgress: 2,
  completionPct: 67,
  studyMinutes: 480,
  streak: 7,
};

export const mockMonthStats = {
  month: '2026-03',
  planned: 30,
  completed: 18,
  inProgress: 5,
  completionPct: 60,
  studyMinutes: 1920,
  streak: 7,
};

export const mockActiveSession = null;

export const mockStartedSession = {
  id: 'session-1',
  userId: 'user-1',
  learningItemId: null,
  startedAt: new Date().toISOString(),
  endedAt: null,
  durationMin: null,
  note: null,
  createdAt: new Date().toISOString(),
  learningItem: null,
};

// ── Handlers ───────────────────────────────────────────────────────────

export const handlers = [
  // Auth
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { password: string };
    if (body.password === 'correct-password') {
      return HttpResponse.json({ accessToken: 'mock-jwt-token' });
    }
    return HttpResponse.json(
      { statusCode: 401, message: 'Invalid password', error: 'Unauthorized' },
      { status: 401 },
    );
  }),

  // Categories
  http.get(`${API_URL}/categories`, () => {
    return HttpResponse.json(mockCategories);
  }),

  // Learning items
  http.get(`${API_URL}/learning-items`, () => {
    return HttpResponse.json({
      data: mockLearningItems,
      total: mockLearningItems.length,
    });
  }),

  http.post(`${API_URL}/learning-items`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      id: 'item-new',
      userId: 'user-1',
      categoryId: null,
      title: body.title,
      description: null,
      notes: null,
      priority: body.priority ?? 'MEDIUM',
      difficulty: 3,
      estimatedHours: null,
      status: 'TO_LEARN',
      dueDate: null,
      targetRole: null,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: null,
    });
  }),

  // Board
  http.get(`${API_URL}/board/today`, () => {
    return HttpResponse.json(mockBoardResponse);
  }),

  http.get(`${API_URL}/board/week`, () => {
    return HttpResponse.json(mockBoardResponse);
  }),

  http.patch(`${API_URL}/board/drag`, () => {
    return HttpResponse.json(mockLearningItems[0]);
  }),

  // Time tracking
  http.get(`${API_URL}/time/sessions/active`, () => {
    return HttpResponse.json(mockActiveSession);
  }),

  http.get(`${API_URL}/time/sessions`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${API_URL}/time/sessions/start`, () => {
    return HttpResponse.json(mockStartedSession);
  }),

  http.post(`${API_URL}/time/sessions/:id/stop`, () => {
    return HttpResponse.json({
      ...mockStartedSession,
      endedAt: new Date().toISOString(),
      durationMin: 25,
    });
  }),

  // Stats
  http.get(`${API_URL}/stats/day`, () => {
    return HttpResponse.json(mockDayStats);
  }),

  http.get(`${API_URL}/stats/week`, () => {
    return HttpResponse.json(mockWeekStats);
  }),

  http.get(`${API_URL}/stats/month`, () => {
    return HttpResponse.json(mockMonthStats);
  }),
];

export const server = setupServer(...handlers);
