import { apiClient } from './client';

import type {
  LearningItem,
  SubItem,
  CreateLearningItemPayload,
  UpdateLearningItemPayload,
  CreateSubItemPayload,
  UpdateSubItemPayload,
  LearningItemsQuery,
  PaginatedLearningItems,
} from '@/types/learning-item.types';
import type { LearnStatus } from '@/types/enums';

export const learningItemsApi = {
  getAll: (params: LearningItemsQuery) =>
    apiClient
      .get<PaginatedLearningItems>('/learning-items', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<LearningItem>(`/learning-items/${id}`)
      .then((r) => r.data),

  create: (data: CreateLearningItemPayload) =>
    apiClient
      .post<LearningItem>('/learning-items', data)
      .then((r) => r.data),

  update: (id: string, data: UpdateLearningItemPayload) =>
    apiClient
      .patch<LearningItem>(`/learning-items/${id}`, data)
      .then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/learning-items/${id}`).then((r) => r.data),

  moveStatus: (id: string, status: LearnStatus) =>
    apiClient
      .post<LearningItem>(`/learning-items/${id}/move-status`, { status })
      .then((r) => r.data),

  // --- Sub-items ---

  getSubItems: (parentId: string) =>
    apiClient
      .get<SubItem[]>(`/learning-items/${parentId}/sub-items`)
      .then((r) => r.data),

  createSubItem: (parentId: string, data: CreateSubItemPayload) =>
    apiClient
      .post<SubItem>(`/learning-items/${parentId}/sub-items`, data)
      .then((r) => r.data),

  updateSubItem: (parentId: string, subId: string, data: UpdateSubItemPayload) =>
    apiClient
      .patch<SubItem>(`/learning-items/${parentId}/sub-items/${subId}`, data)
      .then((r) => r.data),

  removeSubItem: (parentId: string, subId: string) =>
    apiClient
      .delete(`/learning-items/${parentId}/sub-items/${subId}`)
      .then((r) => r.data),

  moveSubItemStatus: (parentId: string, subId: string, status: LearnStatus) =>
    apiClient
      .post<SubItem>(`/learning-items/${parentId}/sub-items/${subId}/move-status`, { status })
      .then((r) => r.data),

  reorderSubItems: (parentId: string, items: Array<{ id: string; sortOrder: number }>) =>
    apiClient
      .post(`/learning-items/${parentId}/sub-items/reorder`, { items })
      .then((r) => r.data),
};
