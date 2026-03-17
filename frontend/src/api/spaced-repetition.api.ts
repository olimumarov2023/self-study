import { apiClient } from './client';

import type { RecordReviewPayload } from '@/types/spaced-repetition.types';

// Backend returns plain arrays — these match SpacedRepetitionWithItem and ScheduleDay from the service
export interface BackendSpacedRepetitionItem {
  id: string;
  userId: string;
  learningItemId: string;
  assessmentRunId: string | null;
  easeFactor: number;
  intervalDays: number;
  reviewCount: number;
  nextReviewAt: string;
  lastReviewAt: string | null;
  createdAt: string;
  updatedAt: string;
  learningItem: {
    id: string;
    title: string;
    categoryId: string | null;
    category: { name: string } | null;
  };
}

export interface BackendScheduleDay {
  date: string;
  items: BackendSpacedRepetitionItem[];
}

export const spacedRepetitionApi = {
  getDueItems: () =>
    apiClient
      .get<BackendSpacedRepetitionItem[]>('/spaced-repetition/due')
      .then((r) => r.data),

  getSchedule: () =>
    apiClient
      .get<BackendScheduleDay[]>('/spaced-repetition/schedule')
      .then((r) => r.data),

  recordReview: (payload: RecordReviewPayload) =>
    apiClient
      .post('/spaced-repetition/review', payload)
      .then((r) => r.data),
};
