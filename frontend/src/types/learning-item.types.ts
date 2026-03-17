import type { Category } from '@/types/category.types';
import type { LearnStatus, Priority } from '@/types/enums';

export interface LearningItem {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  notes: string | null;
  priority: Priority;
  difficulty: number;
  estimatedHours: number | null;
  status: LearnStatus;
  dueDate: string | null;
  targetRole: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  category: Category | null;
}

export interface CreateLearningItemPayload {
  title: string;
  description?: string;
  notes?: string;
  categoryId?: string;
  priority?: Priority;
  difficulty?: number;
  estimatedHours?: number;
  tags?: string[];
  targetRole?: string;
  dueDate?: string;
  status?: LearnStatus;
}

export interface UpdateLearningItemPayload {
  title?: string;
  description?: string;
  notes?: string;
  categoryId?: string | null;
  priority?: Priority;
  difficulty?: number;
  estimatedHours?: number | null;
  tags?: string[];
  targetRole?: string | null;
  dueDate?: string | null;
  status?: LearnStatus;
}

export interface LearningItemsQuery {
  status?: LearnStatus;
  categoryId?: string;
  search?: string;
  priority?: Priority;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface PaginatedLearningItems {
  data: LearningItem[];
  total: number;
}
