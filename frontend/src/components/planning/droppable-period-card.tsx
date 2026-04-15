import { useDroppable } from '@dnd-kit/core';
import { Loader2 } from 'lucide-react';

import { PlanItemRow } from '@/components/planning/plan-item-row';

import type { PlanAssignment } from '@/types/planning.types';
import type { LearningItem } from '@/types/learning-item.types';

interface DroppablePeriodCardProps {
  /** Unique droppable ID (e.g. the period key) */
  id: string;
  /** Display title (e.g. "March 2026", "Week 2 — Mar 3–9") */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Assigned items for this period */
  assignments: PlanAssignment[];
  isLoading?: boolean;
  isError?: boolean;
  /** Show status indicator on items */
  showStatus?: boolean;
  /** Called when an item row is clicked */
  onItemClick?: (item: LearningItem) => void;
}

export function DroppablePeriodCard({
  id,
  title,
  subtitle,
  assignments,
  isLoading,
  isError,
  showStatus,
  onItemClick,
}: DroppablePeriodCardProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 transition-colors ${
        isOver
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-border bg-card'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {assignments.length}
        </span>
      </div>

      {/* Body */}
      <div className="min-h-[60px] p-2 space-y-1.5">
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <p className="py-2 text-center text-xs text-destructive">Failed to load</p>
        )}

        {!isLoading && !isError && assignments.length === 0 && (
          <div className="flex items-center justify-center rounded-md border border-dashed py-4 text-xs text-muted-foreground">
            {isOver ? 'Drop here!' : 'Drag items here'}
          </div>
        )}

        {!isLoading && !isError && assignments.map((a) => (
          <PlanItemRow key={a.id} assignment={a} showStatus={showStatus} onItemClick={onItemClick} />
        ))}
      </div>
    </div>
  );
}
