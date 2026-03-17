import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PlanItemRow } from '@/components/planning/plan-item-row';
import { AssignItemsDialog } from '@/components/planning/assign-items-dialog';
import { useMonthPlan } from '@/queries/use-planning';

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

export function MonthPlannerView() {
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey);
  const [assignOpen, setAssignOpen] = useState(false);

  const { data: assignments, isLoading, isError } = useMonthPlan(monthKey);

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonthKey((prev) => shiftMonth(prev, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[160px] text-center text-lg font-semibold">
            {formatMonthDisplay(monthKey)}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonthKey((prev) => shiftMonth(prev, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={() => setAssignOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Assign Items
        </Button>
      </div>

      {/* Items list */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <p className="py-8 text-center text-sm text-destructive">
          Failed to load month plan.
        </p>
      )}

      {!isLoading && !isError && assignments && assignments.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No items assigned to this month yet. Click "Assign Items" to add some.
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
        level="MONTHLY"
        periodKey={monthKey}
        existingAssignments={assignments ?? []}
      />
    </div>
  );
}
