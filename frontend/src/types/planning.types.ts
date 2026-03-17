import type { LearningItem } from '@/types/learning-item.types';
import type { PlanLevel } from '@/types/enums';

export interface PlanAssignment {
  id: string;
  userId: string;
  learningItemId: string;
  level: PlanLevel;
  periodKey: string;
  rank: number;
  createdAt: string;
  learningItem: LearningItem;
}

export interface AssignPayload {
  learningItemId: string;
  level: 'MONTHLY' | 'WEEKLY' | 'DAILY';
  periodKey: string;
}

export interface ReorderPayload {
  assignments: Array<{ id: string; rank: number }>;
}

export interface AutoDistributePayload {
  weekPeriodKey: string;
}

export interface AutoDistributeResponse {
  created: number;
  assignments: PlanAssignment[];
}
