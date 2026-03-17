import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PlanItemRow } from '@/components/planning/plan-item-row';
import { AssignItemsDialog } from '@/components/planning/assign-items-dialog';
import { useDayPlan, useWeekPlan } from '@/queries/use-planning';
import { LearnStatus } from '@/types/enums';

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

export function DayPlannerView() {
  const [dayKey, setDayKey] = useState(getCurrentDayKey);
  const [assignOpen, setAssignOpen] = useState(false);

  const { data: assignments, isLoading, isError } = useDayPlan(dayKey);

  // Fetch weekly items to use as parent assignments for the assign dialog
  const weekKey = getWeekKeyForDay(dayKey);
  const { data: weekAssignments } = useWeekPlan(weekKey);

  const completedCount = assignments?.filter(
    (a) => a.learningItem.status === LearnStatus.LEARNED,
  ).length ?? 0;
  const totalCount = assignments?.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDayKey((prev) => shiftDay(prev, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[240px] text-center text-lg font-semibold">
            {formatDayDisplay(dayKey)}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDayKey((prev) => shiftDay(prev, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={() => setAssignOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Assign Items
        </Button>
      </div>

      {/* Completion summary */}
      {totalCount > 0 && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <span className="font-medium">
            {completedCount}/{totalCount}
          </span>{' '}
          items completed
          {totalCount > 0 && (
            <span className="ml-2 text-muted-foreground">
              ({Math.round((completedCount / totalCount) * 100)}%)
            </span>
          )}
        </div>
      )}

      {/* Items list */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <p className="py-8 text-center text-sm text-destructive">
          Failed to load day plan.
        </p>
      )}

      {!isLoading && !isError && assignments && assignments.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No items assigned for this day. Assign items from the weekly plan.
        </div>
      )}

      {!isLoading && !isError && assignments && assignments.length > 0 && (
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <PlanItemRow key={assignment.id} assignment={assignment} showStatus />
          ))}
        </div>
      )}

      <AssignItemsDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        level="DAILY"
        periodKey={dayKey}
        existingAssignments={assignments ?? []}
        parentAssignments={weekAssignments}
      />
    </div>
  );
}
