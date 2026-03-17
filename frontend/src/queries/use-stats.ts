import { useQuery } from '@tanstack/react-query';

import { statsApi } from '@/api/stats.api';

export const statsKeys = {
  all: ['stats'] as const,
  day: (date: string) => [...statsKeys.all, 'day', date] as const,
  week: (week: string) => [...statsKeys.all, 'week', week] as const,
  month: (month: string) => [...statsKeys.all, 'month', month] as const,
};

export function useDayStats(date: string) {
  return useQuery({
    queryKey: statsKeys.day(date),
    queryFn: () => statsApi.getDayStats(date),
    enabled: !!date,
  });
}

export function useWeekStats(week: string) {
  return useQuery({
    queryKey: statsKeys.week(week),
    queryFn: () => statsApi.getWeekStats(week),
    enabled: !!week,
  });
}

export function useMonthStats(month: string) {
  return useQuery({
    queryKey: statsKeys.month(month),
    queryFn: () => statsApi.getMonthStats(month),
    enabled: !!month,
  });
}
