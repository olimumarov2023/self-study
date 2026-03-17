import { useQuery } from '@tanstack/react-query';

import { statsApi } from '@/api/stats.api';

import type { ScoreTrendParams } from '@/api/stats.api';

export const statsKeys = {
  all: ['stats'] as const,
  day: (date: string) => [...statsKeys.all, 'day', date] as const,
  week: (week: string) => [...statsKeys.all, 'week', week] as const,
  month: (month: string) => [...statsKeys.all, 'month', month] as const,
  categoryProgress: () => [...statsKeys.all, 'category-progress'] as const,
  scoreTrend: (params?: ScoreTrendParams) => [...statsKeys.all, 'score-trend', params ?? {}] as const,
  heatmap: (year?: number) => [...statsKeys.all, 'heatmap', year ?? 'current'] as const,
  radar: () => [...statsKeys.all, 'radar'] as const,
  forecast: () => [...statsKeys.all, 'forecast'] as const,
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

export function useCategoryProgress() {
  return useQuery({
    queryKey: statsKeys.categoryProgress(),
    queryFn: () => statsApi.getCategoryProgress(),
  });
}

export function useScoreTrend(params?: ScoreTrendParams) {
  return useQuery({
    queryKey: statsKeys.scoreTrend(params),
    queryFn: () => statsApi.getScoreTrend(params),
  });
}

export function useHeatmap(year?: number) {
  return useQuery({
    queryKey: statsKeys.heatmap(year),
    queryFn: () => statsApi.getHeatmap(year),
  });
}

export function useRadar() {
  return useQuery({
    queryKey: statsKeys.radar(),
    queryFn: () => statsApi.getRadar(),
  });
}

export function useForecast() {
  return useQuery({
    queryKey: statsKeys.forecast(),
    queryFn: () => statsApi.getForecast(),
  });
}
