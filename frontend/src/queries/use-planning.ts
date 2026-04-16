import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { planningApi } from '@/api/planning.api';

import type {
  AssignPayload,
  ReorderPayload,
  AutoDistributePayload,
} from '@/types/planning.types';

export const planningKeys = {
  all: ['planning'] as const,
  months: () => [...planningKeys.all, 'month'] as const,
  month: (yyyyMM: string) => [...planningKeys.months(), yyyyMM] as const,
  weeks: () => [...planningKeys.all, 'week'] as const,
  week: (yyyyWww: string) => [...planningKeys.weeks(), yyyyWww] as const,
  days: () => [...planningKeys.all, 'day'] as const,
  day: (yyyyMMdd: string) => [...planningKeys.days(), yyyyMMdd] as const,
};

export function useMonthPlan(yyyyMM: string) {
  return useQuery({
    queryKey: planningKeys.month(yyyyMM),
    queryFn: () => planningApi.getMonth(yyyyMM),
    enabled: !!yyyyMM,
  });
}

export function useWeekPlan(yyyyWww: string) {
  return useQuery({
    queryKey: planningKeys.week(yyyyWww),
    queryFn: () => planningApi.getWeek(yyyyWww),
    enabled: !!yyyyWww,
  });
}

export function useDayPlan(yyyyMMdd: string) {
  return useQuery({
    queryKey: planningKeys.day(yyyyMMdd),
    queryFn: () => planningApi.getDay(yyyyMMdd),
    enabled: !!yyyyMMdd,
  });
}

export function useAssignItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignPayload) => planningApi.assign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planningKeys.all });
    },
  });
}

export function useReorder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReorderPayload) => planningApi.reorder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planningKeys.all });
    },
  });
}

export function useAutoDistribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AutoDistributePayload) =>
      planningApi.autoDistribute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planningKeys.all });
    },
  });
}

export function useItemDates(itemId: string) {
  return useQuery({
    queryKey: [...planningKeys.all, 'item-dates', itemId] as const,
    queryFn: () => planningApi.getItemDates(itemId),
    enabled: !!itemId,
  });
}

export function useAssignDates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ learningItemId, dates }: { learningItemId: string; dates: string[] }) =>
      planningApi.assignDates(learningItemId, dates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planningKeys.all });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });
}
