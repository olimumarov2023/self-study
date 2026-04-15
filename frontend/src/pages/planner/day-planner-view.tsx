import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DroppablePeriodCard } from '@/components/planning/droppable-period-card';
import { useDayPlan } from '@/queries/use-planning';

import type { LearningItem } from '@/types/learning-item.types';

function getCurrentDayKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDayDisplay(yyyyMMdd: string): string {
  const [year, month, day] = yyyyMMdd.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function shiftDay(yyyyMMdd: string, delta: number): string {
  const [year, month, day] = yyyyMMdd.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day) + delta);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

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

function getWeekKeyForDay(yyyyMMdd: string): string {
  const [year, month, day] = yyyyMMdd.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const weekYear = getISOWeekYear(date);
  const weekNum = getISOWeekNumber(date);
  return `${weekYear}-W${String(weekNum).padStart(2, '0')}`;
}

interface DayPlannerViewProps {
  onWeekChange?: (weekKey: string) => void;
  onDayChange?: (dayKey: string) => void;
  onItemClick?: (item: LearningItem) => void;
}

export function DayPlannerView({ onWeekChange, onDayChange, onItemClick }: DayPlannerViewProps) {
  const [dayKey, setDayKey] = useState(() => {
    const key = getCurrentDayKey();
    onWeekChange?.(getWeekKeyForDay(key));
    onDayChange?.(key);
    return key;
  });

  const { data: assignments, isLoading, isError } = useDayPlan(dayKey);

  function changeDay(delta: number) {
    setDayKey((prev) => {
      const next = shiftDay(prev, delta);
      const nextWeekKey = getWeekKeyForDay(next);
      const prevWeekKey = getWeekKeyForDay(prev);
      if (nextWeekKey !== prevWeekKey) {
        onWeekChange?.(nextWeekKey);
      }
      onDayChange?.(next);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => changeDay(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[240px] text-center text-lg font-semibold">
          {formatDayDisplay(dayKey)}
        </span>
        <Button variant="outline" size="icon" onClick={() => changeDay(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Droppable day card */}
      <DroppablePeriodCard
        id={`day:${dayKey}`}
        title={formatDayDisplay(dayKey)}
        assignments={assignments ?? []}
        isLoading={isLoading}
        isError={isError}
        showStatus
        onItemClick={onItemClick}
      />
    </div>
  );
}
