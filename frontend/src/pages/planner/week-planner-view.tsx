import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PlanItemRow } from '@/components/planning/plan-item-row';
import { AssignItemsDialog } from '@/components/planning/assign-items-dialog';
import { AutoDistributeButton } from '@/components/planning/auto-distribute-button';
import { useWeekPlan, useMonthPlan } from '@/queries/use-planning';

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

function getCurrentWeekKey(): string {
  const now = new Date();
  const year = getISOWeekYear(now);
  const week = getISOWeekNumber(now);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function parseWeekKey(weekKey: string): { year: number; week: number } {
  const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return { year: 2026, week: 1 };
  return { year: Number(match[1]), week: Number(match[2]) };
}

function shiftWeek(weekKey: string, delta: number): string {
  const { year, week } = parseWeekKey(weekKey);

  // Get Monday of current week, then shift by delta weeks
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setUTCDate(jan4.getUTCDate() - jan4Day + 1);

  const targetMonday = new Date(mondayOfWeek1);
  targetMonday.setUTCDate(mondayOfWeek1.getUTCDate() + (week - 1 + delta) * 7);

  const newYear = getISOWeekYear(targetMonday);
  const newWeek = getISOWeekNumber(targetMonday);
  return `${newYear}-W${String(newWeek).padStart(2, '0')}`;
}

function getMonthKeyForWeek(weekKey: string): string {
  const { year, week } = parseWeekKey(weekKey);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setUTCDate(jan4.getUTCDate() - jan4Day + 1);

  const targetMonday = new Date(mondayOfWeek1);
  targetMonday.setUTCDate(mondayOfWeek1.getUTCDate() + (week - 1) * 7);

  const yyyy = targetMonday.getUTCFullYear();
  const mm = String(targetMonday.getUTCMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

export function WeekPlannerView() {
  const [weekKey, setWeekKey] = useState(getCurrentWeekKey);
  const [assignOpen, setAssignOpen] = useState(false);

  const { data: assignments, isLoading, isError } = useWeekPlan(weekKey);

  // Fetch monthly items to use as parent assignments for the assign dialog
  const monthKey = getMonthKeyForWeek(weekKey);
  const { data: monthAssignments } = useMonthPlan(monthKey);

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekKey((prev) => shiftWeek(prev, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[120px] text-center text-lg font-semibold">
            {weekKey}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekKey((prev) => shiftWeek(prev, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <AutoDistributeButton weekPeriodKey={weekKey} />
          <Button onClick={() => setAssignOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Assign Items
          </Button>
        </div>
      </div>

      {/* Items list */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <p className="py-8 text-center text-sm text-destructive">
          Failed to load week plan.
        </p>
      )}

      {!isLoading && !isError && assignments && assignments.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No items assigned to this week yet. Assign items from the monthly plan or auto-distribute.
        </div>
      )}

      {!isLoading && !isError && assignments && assignments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {assignments.length} item{assignments.length !== 1 ? 's' : ''} planned
          </p>
          {assignments.map((assignment) => (
            <PlanItemRow key={assignment.id} assignment={assignment} />
          ))}
        </div>
      )}

      <AssignItemsDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        level="WEEKLY"
        periodKey={weekKey}
        existingAssignments={assignments ?? []}
        parentAssignments={monthAssignments}
      />
    </div>
  );
}
