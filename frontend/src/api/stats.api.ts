import { apiClient } from './client';

import type { DayStats, WeekStats, MonthStats, CategoryProgress, ScoreTrendPoint, HeatmapDay, RadarDataPoint, ForecastData } from '@/types/stats.types';

export interface ScoreTrendParams {
  learningItemId?: string;
  from?: string;
  to?: string;
}

export const statsApi = {
  getDayStats: (date: string) =>
    apiClient.get<DayStats>('/stats/day', { params: { date } }).then((r) => r.data),

  getWeekStats: (week: string) =>
    apiClient.get<WeekStats>('/stats/week', { params: { week } }).then((r) => r.data),

  getMonthStats: (month: string) =>
    apiClient.get<MonthStats>('/stats/month', { params: { month } }).then((r) => r.data),

  getCategoryProgress: () =>
    apiClient.get<CategoryProgress[]>('/stats/category-progress').then((r) => r.data),

  getScoreTrend: (params?: ScoreTrendParams) =>
    apiClient.get<ScoreTrendPoint[]>('/stats/score-trend', { params }).then((r) => r.data),

  getHeatmap: (year?: number) =>
    apiClient.get<HeatmapDay[]>('/stats/heatmap', { params: year ? { year } : undefined }).then((r) => r.data),

  getRadar: () =>
    apiClient.get<RadarDataPoint[]>('/stats/radar').then((r) => r.data),

  getForecast: () =>
    apiClient.get<ForecastData>('/stats/forecast').then((r) => r.data),
};
