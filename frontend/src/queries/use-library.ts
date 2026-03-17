import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { libraryApi } from '@/api/library.api';

import type { ListResourcesParams } from '@/api/library.api';
import type {
  CreateResourcePayload,
  UpdateResourcePayload,
  CreateSessionPayload,
} from '@/types/library.types';

export const libraryKeys = {
  all: ['library'] as const,
  lists: () => [...libraryKeys.all, 'list'] as const,
  list: (params?: ListResourcesParams) =>
    [...libraryKeys.lists(), params ?? {}] as const,
  details: () => [...libraryKeys.all, 'detail'] as const,
  detail: (id: string) => [...libraryKeys.details(), id] as const,
  sessions: (resourceId: string) =>
    [...libraryKeys.detail(resourceId), 'sessions'] as const,
};

export function useLibraryResources(filters?: ListResourcesParams) {
  return useQuery({
    queryKey: libraryKeys.list(filters),
    queryFn: () => libraryApi.listResources(filters),
  });
}

export function useLibraryResource(id: string) {
  return useQuery({
    queryKey: libraryKeys.detail(id),
    queryFn: () => libraryApi.getResource(id),
    enabled: !!id,
  });
}

export function useLibrarySessions(resourceId: string) {
  return useQuery({
    queryKey: libraryKeys.sessions(resourceId),
    queryFn: () => libraryApi.listSessions(resourceId),
    enabled: !!resourceId,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateResourcePayload) =>
      libraryApi.createResource(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateResourcePayload }) =>
      libraryApi.updateResource(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: libraryKeys.lists() });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => libraryApi.deleteResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      resourceId,
      payload,
    }: {
      resourceId: string;
      payload: CreateSessionPayload;
    }) => libraryApi.createSession(resourceId, payload),
    onSuccess: (_data, { resourceId }) => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.detail(resourceId) });
      queryClient.invalidateQueries({ queryKey: libraryKeys.sessions(resourceId) });
    },
  });
}
