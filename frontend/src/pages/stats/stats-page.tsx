import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CompletionDonut } from '@/components/stats/completion-donut';
import { PlannedVsCompleted } from '@/components/stats/planned-vs-completed';
import { StudyHoursSummary } from '@/components/stats/study-hours-summary';
import { StreakDisplay } from '@/components/stats/streak-display';
import { CategoryProgressChart } from '@/components/stats/category-progress-chart';
import { ScoreTrendChart } from '@/components/stats/score-trend-chart';
import { HeatmapCalendar } from '@/components/stats/heatmap-calendar';
import { RadarChart } from '@/components/stats/radar-chart';
import { CompletionForecast } from '@/components/stats/completion-forecast';
import { useDayStats, useWeekStats, useMonthStats } from '@/queries/use-stats';

import type { PeriodStats } from '@/types/stats.types';

type Period = 'day' | 'week' | 'month';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getISOWeekString(date: Date): string {
  // Get the Thursday of the week to determine the ISO week number
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getMonthString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getPeriodLabel(period: Period, offset: number): string {
  const now = new Date();

  if (period === 'day') {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() + offset * 7);
    return getISOWeekString(d);
  }

  // month
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getPeriodKey(period: Period, offset: number): string {
  const now = new Date();

  if (period === 'day') {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return formatDate(d);
  }

  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() + offset * 7);
    return getISOWeekString(d);
  }

  // month
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return getMonthString(d);
}

export function StatsPage() {
  const [period, setPeriod] = useState<Period>('day');
  const [offset, setOffset] = useState(0);

  const periodKey = useMemo(() => getPeriodKey(period, offset), [period, offset]);
  const periodLabel = useMemo(() => getPeriodLabel(period, offset), [period, offset]);

  const dayQuery = useDayStats(period === 'day' ? periodKey : '');
  const weekQuery = useWeekStats(period === 'week' ? periodKey : '');
  const monthQuery = useMonthStats(period === 'month' ? periodKey : '');

  const activeQuery = period === 'day' ? dayQuery : period === 'week' ? weekQuery : monthQuery;
  const stats: PeriodStats | undefined = activeQuery.data;
  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;

  const handlePeriodChange = (value: string) => {
    setPeriod(value as Period);
    setOffset(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
        <p className="text-muted-foreground">
          Track your learning progress over time.
        </p>
      </div>

      {/* Period toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={period} onValueChange={handlePeriodChange}>
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Period navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setOffset((o) => o - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium">
            {periodLabel}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setOffset((o) => o + 1)}
            disabled={offset >= 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {offset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setOffset(0)}>
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load statistics. Please try again.
        </div>
      )}

      {/* Stats grid */}
      {!isLoading && !isError && stats && (
        <div className="grid gap-4 sm:grid-cols-2">
          <CompletionDonut
            completionPct={stats.completionPct}
            completed={stats.completed}
            planned={stats.planned}
          />
          <PlannedVsCompleted
            planned={stats.planned}
            completed={stats.completed}
            inProgress={stats.inProgress}
          />
          <StudyHoursSummary studyMinutes={stats.studyMinutes} />
          <StreakDisplay streak={stats.streak} />
        </div>
      )}

      {/* Learning Analytics */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Learning Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Understand how your effort is distributed across categories and how your scores change over time.
          </p>
        </div>

        <div className="space-y-4">
          <CategoryProgressChart />
          <ScoreTrendChart />
        </div>
      </div>

      {/* Activity heatmap */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Activity</h2>
          <p className="text-sm text-muted-foreground">
            Daily study sessions across the year.
          </p>
        </div>
        <HeatmapCalendar />
      </div>

      {/* Category balance + Forecast */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Insights</h2>
          <p className="text-sm text-muted-foreground">
            Category balance and your projected completion date.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <RadarChart />
          <CompletionForecast />
        </div>
      </div>
    </div>
  );
}
