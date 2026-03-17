import { apiClient } from './client';

import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from '@/types/category.types';

export const categoriesApi = {
  getAll: () =>
    apiClient.get<Category[]>('/categories').then((r) => r.data),

  create: (data: CreateCategoryPayload) =>
    apiClient.post<Category>('/categories', data).then((r) => r.data),

  update: (id: string, data: UpdateCategoryPayload) =>
    apiClient.patch<Category>(`/categories/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/categories/${id}`).then((r) => r.data),
};
