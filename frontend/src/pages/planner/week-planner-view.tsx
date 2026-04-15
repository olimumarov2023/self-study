import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DroppablePeriodCard } from '@/components/planning/droppable-period-card';
import { AutoDistributeButton } from '@/components/planning/auto-distribute-button';
import { useWeekPlan } from '@/queries/use-planning';

import type { LearningItem } from '@/types/learning-item.types';

/* ── ISO week helpers ────────────────────────────────── */

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getISOWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

function getMondayOfISOWeek(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const target = new Date(mondayOfWeek1);
  target.setUTCDate(mondayOfWeek1.getUTCDate() + (week - 1) * 7);
  return target;
}

function toWeekKey(year: number, week: number): string {
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthDisplay(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function shiftMonth(yyyyMM: string, delta: number): string {
  const [year, month] = yyyyMM.split('-');
  const date = new Date(Number(year), Number(month) - 1 + delta);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

/* ── Get all ISO weeks that overlap a given month ────── */

interface WeekInfo {
  weekKey: string;
  weekOfMonth: number;
  monday: Date;
  sunday: Date;
  label: string;
  dateRange: string;
}

function getWeeksOfMonth(yyyyMM: string): WeekInfo[] {
  const [yearStr, monthStr] = yyyyMM.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1; // 0-indexed

  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0));

  const weeks: WeekInfo[] = [];
  const seen = new Set<string>();

  // Iterate each day of the month, collect unique weeks
  for (let d = new Date(firstDay); d <= lastDay; d.setUTCDate(d.getUTCDate() + 1)) {
    const wy = getISOWeekYear(d);
    const wn = getISOWeekNumber(d);
    const key = toWeekKey(wy, wn);
    if (seen.has(key)) continue;
    seen.add(key);

    const monday = getMondayOfISOWeek(wy, wn);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const fmtDay = (dt: Date) =>
      dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

    weeks.push({
      weekKey: key,
      weekOfMonth: weeks.length + 1,
      monday,
      sunday,
      label: `Week ${weeks.length + 1}`,
      dateRange: `${fmtDay(monday)} – ${fmtDay(sunday)}`,
    });
  }

  return weeks;
}

/* ── Component ───────────────────────────────────────── */

interface WeekPlannerViewProps {
  onMonthChange?: (monthKey: string) => void;
  onItemClick?: (item: LearningItem) => void;
}

export function WeekPlannerView({ onMonthChange, onItemClick }: WeekPlannerViewProps) {
  const [monthKey, setMonthKey] = useState(() => {
    const key = getCurrentMonthKey();
    onMonthChange?.(key);
    return key;
  });

  const weeks = useMemo(() => getWeeksOfMonth(monthKey), [monthKey]);

  // Fetch data for all weeks in this month
  const weekQueries = weeks.map((w) => ({
    weekInfo: w,
    // eslint-disable-next-line react-hooks/rules-of-hooks
    query: useWeekPlan(w.weekKey),
  }));

  function changeMonth(delta: number) {
    setMonthKey((prev) => {
      const next = shiftMonth(prev, delta);
      onMonthChange?.(next);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Month selector */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[160px] text-center text-lg font-semibold">
          {formatMonthDisplay(monthKey)}
        </span>
        <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {weekQueries.map(({ weekInfo, query }) => (
          <div key={weekInfo.weekKey} className="space-y-1">
            <DroppablePeriodCard
              id={`week:${weekInfo.weekKey}`}
              title={weekInfo.label}
              subtitle={weekInfo.dateRange}
              assignments={query.data ?? []}
              isLoading={query.isLoading}
              isError={query.isError}
              onItemClick={onItemClick}
            />
            <div className="flex justify-end">
              <AutoDistributeButton weekPeriodKey={weekInfo.weekKey} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
