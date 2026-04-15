import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { studyTrackerApi } from '@/api/study-tracker.api';

import type {
  CreateBookPayload,
  UpdateBookPayload,
  CreateChapterPayload,
  UpdateChapterPayload,
  CreateTopicPayload,
  UpdateTopicPayload,
} from '@/types/study-tracker.types';

export const studyTrackerKeys = {
  all: ['study-tracker'] as const,
  lists: () => [...studyTrackerKeys.all, 'list'] as const,
  details: () => [...studyTrackerKeys.all, 'detail'] as const,
  detail: (id: string) => [...studyTrackerKeys.details(), id] as const,
};

export function useStudyBooks() {
  return useQuery({
    queryKey: studyTrackerKeys.lists(),
    queryFn: () => studyTrackerApi.listBooks(),
  });
}

export function useStudyBook(id: string) {
  return useQuery({
    queryKey: studyTrackerKeys.detail(id),
    queryFn: () => studyTrackerApi.getBook(id),
    enabled: !!id,
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookPayload) =>
      studyTrackerApi.createBook(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studyTrackerKeys.lists() });
    },
  });
}

export function useUpdateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBookPayload }) =>
      studyTrackerApi.updateBook(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: studyTrackerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: studyTrackerKeys.lists() });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studyTrackerApi.deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studyTrackerKeys.all });
    },
  });
}

export function useCreateChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookId,
      payload,
    }: {
      bookId: string;
      payload: CreateChapterPayload;
    }) => studyTrackerApi.createChapter(bookId, payload),
    onSuccess: (_data, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: studyTrackerKeys.detail(bookId) });
      queryClient.invalidateQueries({ queryKey: studyTrackerKeys.lists() });
    },
  });
}

export function useUpdateChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; bookId: string; payload: UpdateChapterPayload }) =>
      studyTrackerApi.updateChapter(vars.id, vars.payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: studyTrackerKeys.detail(vars.bookId) });
      queryClient.invalidateQueries({ queryKey: studyTrackerKeys.lists() });
    },
  });
}

export function useDeleteChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; bookId: string }) =>
      studyTrackerApi.deleteChapter(vars.id),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: studyTrackerKeys.detail(vars.bookId) });
      queryClient.invalidateQueries({ queryKey: studyTrackerKeys.lists() });
    },
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { chapterId: string; bookId: string; payload: CreateTopicPayload }) =>
      studyTrackerApi.createTopic(vars.chapterId, vars.payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: studyTrackerKeys.detail(vars.bookId) });
      queryClient.invalidateQueries({ queryKey: studyTrackerKeys.lists() });
    },
  });
}

export function useUpdateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; bookId: string; payload: UpdateTopicPayload }) =>
      studyTrackerApi.updateTopic(vars.id, vars.payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: studyTrackerKeys.detail(vars.bookId) });
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; bookId: string }) =>
      studyTrackerApi.deleteTopic(vars.id),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: studyTrackerKeys.detail(vars.bookId) });
      queryClient.invalidateQueries({ queryKey: studyTrackerKeys.lists() });
    },
  });
}

export function useToggleTopicLearned() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; bookId: string }) =>
      studyTrackerApi.toggleTopicLearned(vars.id),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: studyTrackerKeys.detail(vars.bookId) });
      queryClient.invalidateQueries({ queryKey: studyTrackerKeys.lists() });
    },
  });
}
