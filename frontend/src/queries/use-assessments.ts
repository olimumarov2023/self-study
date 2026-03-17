import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { assessmentsApi } from '@/api/assessments.api';

import type {
  GenerateAssessmentPayload,
  SubmitAssessmentPayload,
  AssessmentHistoryQuery,
} from '@/types/assessment.types';

export const assessmentKeys = {
  all: ['assessments'] as const,
  lists: () => [...assessmentKeys.all, 'list'] as const,
  list: (query: AssessmentHistoryQuery) =>
    [...assessmentKeys.lists(), query] as const,
  details: () => [...assessmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...assessmentKeys.details(), id] as const,
  results: (id: string) =>
    [...assessmentKeys.detail(id), 'results'] as const,
  history: (query: AssessmentHistoryQuery) =>
    [...assessmentKeys.all, 'history', query] as const,
};

export function useAssessment(id: string) {
  return useQuery({
    queryKey: assessmentKeys.detail(id),
    queryFn: () => assessmentsApi.getById(id),
    enabled: !!id,
  });
}

export function useAssessmentResults(id: string) {
  return useQuery({
    queryKey: assessmentKeys.results(id),
    queryFn: () => assessmentsApi.getResults(id),
    enabled: !!id,
  });
}

export function useAssessmentHistory(query: AssessmentHistoryQuery) {
  return useQuery({
    queryKey: assessmentKeys.history(query),
    queryFn: () => assessmentsApi.getHistory(query),
  });
}

export function useGenerateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateAssessmentPayload) =>
      assessmentsApi.generate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.all });
    },
  });
}

export function useSubmitAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SubmitAssessmentPayload }) =>
      assessmentsApi.submit(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.detail(id) });
    },
  });
}
