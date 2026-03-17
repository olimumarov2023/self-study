import { apiClient } from './client';

import type {
  LibraryResource,
  ResourceSession,
  CreateResourcePayload,
  UpdateResourcePayload,
  CreateSessionPayload,
} from '@/types/library.types';

export interface ListResourcesParams {
  type?: string;
  status?: string;
}

export const libraryApi = {
  listResources: (params?: ListResourcesParams) =>
    apiClient
      .get<LibraryResource[]>('/library', { params })
      .then((r) => r.data),

  getResource: (id: string) =>
    apiClient
      .get<LibraryResource>(`/library/${id}`)
      .then((r) => r.data),

  createResource: (payload: CreateResourcePayload) =>
    apiClient
      .post<LibraryResource>('/library', payload)
      .then((r) => r.data),

  updateResource: (id: string, payload: UpdateResourcePayload) =>
    apiClient
      .patch<LibraryResource>(`/library/${id}`, payload)
      .then((r) => r.data),

  deleteResource: (id: string) =>
    apiClient
      .delete<void>(`/library/${id}`)
      .then((r) => r.data),

  listSessions: (resourceId: string) =>
    apiClient
      .get<ResourceSession[]>(`/library/${resourceId}/sessions`)
      .then((r) => r.data),

  createSession: (resourceId: string, payload: CreateSessionPayload) =>
    apiClient
      .post<ResourceSession>(`/library/${resourceId}/sessions`, payload)
      .then((r) => r.data),
};
