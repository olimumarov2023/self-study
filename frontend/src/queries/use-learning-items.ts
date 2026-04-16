import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { learningItemsApi } from '@/api/learning-items.api';

import type {
  CreateLearningItemPayload,
  UpdateLearningItemPayload,
  CreateSubItemPayload,
  UpdateSubItemPayload,
  LearningItemsQuery,
} from '@/types/learning-item.types';
import type { LearnStatus } from '@/types/enums';

export const learningItemKeys = {
  all: ['learning-items'] as const,
  lists: () => [...learningItemKeys.all, 'list'] as const,
  list: (filters: LearningItemsQuery) =>
    [...learningItemKeys.lists(), filters] as const,
  details: () => [...learningItemKeys.all, 'detail'] as const,
  detail: (id: string) => [...learningItemKeys.details(), id] as const,
};

export function useLearningItems(filters: LearningItemsQuery) {
  return useQuery({
    queryKey: learningItemKeys.list(filters),
    queryFn: () => learningItemsApi.getAll(filters),
  });
}

export function useLearningItem(id: string) {
  return useQuery({
    queryKey: learningItemKeys.detail(id),
    queryFn: () => learningItemsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateLearningItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLearningItemPayload) =>
      learningItemsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningItemKeys.lists() });
    },
  });
}

export function useUpdateLearningItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLearningItemPayload }) =>
      learningItemsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningItemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: learningItemKeys.details() });
      queryClient.invalidateQueries({ queryKey: ['planning'] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useDeleteLearningItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => learningItemsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningItemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['planning'] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useMoveStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LearnStatus }) =>
      learningItemsApi.moveStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningItemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: learningItemKeys.details() });
    },
  });
}

// --- Sub-item hooks ---

export const subItemKeys = {
  all: (parentId: string) => [...learningItemKeys.detail(parentId), 'sub-items'] as const,
};

export function useSubItems(parentId: string) {
  return useQuery({
    queryKey: subItemKeys.all(parentId),
    queryFn: () => learningItemsApi.getSubItems(parentId),
    enabled: !!parentId,
  });
}

export function useCreateSubItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ parentId, data }: { parentId: string; data: CreateSubItemPayload }) =>
      learningItemsApi.createSubItem(parentId, data),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: subItemKeys.all(vars.parentId) });
      queryClient.invalidateQueries({ queryKey: learningItemKeys.detail(vars.parentId) });
      queryClient.invalidateQueries({ queryKey: learningItemKeys.lists() });
    },
  });
}

export function useUpdateSubItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ parentId, subId, data }: { parentId: string; subId: string; data: UpdateSubItemPayload }) =>
      learningItemsApi.updateSubItem(parentId, subId, data),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: subItemKeys.all(vars.parentId) });
    },
  });
}

export function useDeleteSubItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ parentId, subId }: { parentId: string; subId: string }) =>
      learningItemsApi.removeSubItem(parentId, subId),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: subItemKeys.all(vars.parentId) });
      queryClient.invalidateQueries({ queryKey: learningItemKeys.detail(vars.parentId) });
      queryClient.invalidateQueries({ queryKey: learningItemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['planning'] });
    },
  });
}

export function useMoveSubItemStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ parentId, subId, status }: { parentId: string; subId: string; status: LearnStatus }) =>
      learningItemsApi.moveSubItemStatus(parentId, subId, status),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: subItemKeys.all(vars.parentId) });
      queryClient.invalidateQueries({ queryKey: learningItemKeys.detail(vars.parentId) });
      queryClient.invalidateQueries({ queryKey: learningItemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['planning'] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });
}
