import { useMemo } from 'react';

import { useTodayBoard } from '@/queries/use-board';
import { useDayStats } from '@/queries/use-stats';

import type { BoardItem } from '@/types/board.types';
import type { DayStats } from '@/types/stats.types';

export interface DashboardStats {
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  progressPercent: number;
  studyMinutes: number;
  streak: number;
}

function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function useDashboard() {
  const todayBoard = useTodayBoard();
  const todayDate = useMemo(() => getTodayDate(), []);
  const dayStatsQuery = useDayStats(todayDate);

  const allItems = useMemo<BoardItem[]>(() => {
    if (!todayBoard.data?.columns) return [];
    const items: BoardItem[] = [];
    for (const columnItems of Object.values(todayBoard.data.columns)) {
      items.push(...columnItems);
    }
    return items;
  }, [todayBoard.data]);

  const stats = useMemo<DashboardStats>(() => {
    const dayStats: DayStats | undefined = dayStatsQuery.data;

    if (dayStats) {
      return {
        totalItems: dayStats.planned,
        completedItems: dayStats.completed,
        inProgressItems: dayStats.inProgress,
        progressPercent: dayStats.completionPct,
        studyMinutes: dayStats.studyMinutes,
        streak: dayStats.streak,
      };
    }

    // Fallback to board-derived stats if stats API hasn't loaded yet
    return {
      totalItems: allItems.length,
      completedItems: 0,
      inProgressItems: 0,
      progressPercent: 0,
      studyMinutes: 0,
      streak: 0,
    };
  }, [dayStatsQuery.data, allItems]);

  return {
    allItems,
    stats,
    date: todayBoard.data?.date,
    isLoading: todayBoard.isLoading,
    isError: todayBoard.isError,
    isStatsLoading: dayStatsQuery.isLoading,
  };
}
