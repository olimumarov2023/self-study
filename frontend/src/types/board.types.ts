import type { LearnStatus, Priority } from '@/types/enums';

export interface BoardItem {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  difficulty: number;
  estimatedHours: number | null;
  status: LearnStatus;
  tags: string[];
  category: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  rank: number;
}

export interface BoardResponse {
  columns: Record<string, BoardItem[]>;
  date?: string;
  weekDates?: string[];
}

export interface DragPayload {
  learningItemId: string;
  newStatus: LearnStatus;
  newRank?: number;
}
