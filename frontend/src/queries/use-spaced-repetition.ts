import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { spacedRepetitionApi } from '@/api/spaced-repetition.api';

import type { RecordReviewPayload } from '@/types/spaced-repetition.types';

export const spacedRepetitionKeys = {
  all: ['spaced-repetition'] as const,
  due: () => [...spacedRepetitionKeys.all, 'due'] as const,
  schedule: () => [...spacedRepetitionKeys.all, 'schedule'] as const,
};

export function useDueItems() {
  return useQuery({
    queryKey: spacedRepetitionKeys.due(),
    queryFn: () => spacedRepetitionApi.getDueItems(),
    refetchOnWindowFocus: true,
  });
}

export function useReviewSchedule() {
  return useQuery({
    queryKey: spacedRepetitionKeys.schedule(),
    queryFn: () => spacedRepetitionApi.getSchedule(),
  });
}

export function useRecordReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordReviewPayload) =>
      spacedRepetitionApi.recordReview(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: spacedRepetitionKeys.all });
    },
  });
}
