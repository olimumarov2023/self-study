import type { Category } from '@/types/category.types';
import type { LearnStatus, Priority } from '@/types/enums';

export interface SubItem {
  id: string;
  userId: string;
  parentId: string;
  title: string;
  description: string | null;
  notes: string | null;
  priority: Priority;
  difficulty: number;
  estimatedHours: number | null;
  status: LearnStatus;
  tags: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface LearningItem {
  id: string;
  userId: string;
  categoryId: string | null;
  parentId: string | null;
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
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  category: Category | null;
  subItems?: SubItem[];
}

export interface CreateSubItemPayload {
  title: string;
  description?: string;
  notes?: string;
  priority?: Priority;
  difficulty?: number;
  estimatedHours?: number;
  tags?: string[];
  sortOrder?: number;
}

export interface UpdateSubItemPayload {
  title?: string;
  description?: string;
  notes?: string;
  priority?: Priority;
  difficulty?: number;
  estimatedHours?: number | null;
  tags?: string[];
  sortOrder?: number;
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
