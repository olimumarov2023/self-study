import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DroppablePeriodCard } from '@/components/planning/droppable-period-card';
import { useMonthPlan } from '@/queries/use-planning';

import type { LearningItem } from '@/types/learning-item.types';

function getCurrentMonthKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
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

interface MonthPlannerViewProps {
  onMonthChange?: (monthKey: string) => void;
  onItemClick?: (item: LearningItem) => void;
}

export function MonthPlannerView({ onMonthChange, onItemClick }: MonthPlannerViewProps) {
  const [monthKey, setMonthKey] = useState(() => {
    const key = getCurrentMonthKey();
    onMonthChange?.(key);
    return key;
  });

  const { data: assignments, isLoading, isError } = useMonthPlan(monthKey);

  function changeMonth(delta: number) {
    setMonthKey((prev) => {
      const next = shiftMonth(prev, delta);
      onMonthChange?.(next);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Period selector */}
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

      {/* Droppable month card */}
      <DroppablePeriodCard
        id={`month:${monthKey}`}
        title={formatMonthDisplay(monthKey)}
        assignments={assignments ?? []}
        isLoading={isLoading}
        isError={isError}
        onItemClick={onItemClick}
      />
    </div>
  );
}
