import type { LearningItem } from '@/types/learning-item.types';

export interface StudySession {
  id: string;
  userId: string;
  learningItemId: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMin: number | null;
  note: string | null;
  createdAt: string;
  learningItem: LearningItem | null;
}

export interface StartSessionPayload {
  learningItemId?: string;
}

export interface StopSessionPayload {
  note?: string;
}

export interface ManualSessionPayload {
  learningItemId?: string;
  startedAt: string;
  endedAt: string;
  note?: string;
}

export interface SessionsQuery {
  from?: string;
  to?: string;
}
