import { apiClient } from './client';

import type {
  LearningItem,
  CreateLearningItemPayload,
  UpdateLearningItemPayload,
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
};
