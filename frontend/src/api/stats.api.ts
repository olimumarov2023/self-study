import { apiClient } from './client';

import type { DayStats, WeekStats, MonthStats } from '@/types/stats.types';

export const statsApi = {
  getDayStats: (date: string) =>
    apiClient.get<DayStats>('/stats/day', { params: { date } }).then((r) => r.data),

  getWeekStats: (week: string) =>
    apiClient.get<WeekStats>('/stats/week', { params: { week } }).then((r) => r.data),

  getMonthStats: (month: string) =>
    apiClient.get<MonthStats>('/stats/month', { params: { month } }).then((r) => r.data),
};
