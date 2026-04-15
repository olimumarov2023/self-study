import { useDroppable } from '@dnd-kit/core';
import { CheckCircle2, Loader2 } from 'lucide-react';

import { PlanItemRow } from '@/components/planning/plan-item-row';
import { cn } from '@/lib/utils';

import type { PlanAssignment } from '@/types/planning.types';
import type { LearningItem } from '@/types/learning-item.types';

interface DroppablePeriodCardProps {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  /** Numbered circle shown before the title */
  numberBadge?: number;
  /** Temporal status — dims past, highlights current */
  timeStatus?: 'past' | 'current' | 'future';
  assignments: PlanAssignment[];
  isLoading?: boolean;
  isError?: boolean;
  showStatus?: boolean;
  highlight?: boolean;
  onItemClick?: (item: LearningItem) => void;
}

export function DroppablePeriodCard({
  id,
  title,
  subtitle,
  badge,
  numberBadge,
  timeStatus,
  assignments,
  isLoading,
  isError,
  showStatus,
  highlight,
  onItemClick,
}: DroppablePeriodCardProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const isPast = timeStatus === 'past';

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg border-2 transition-colors',
        isPast && 'opacity-60',
        isOver
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : highlight
            ? 'border-primary/40 bg-primary/[0.03]'
            : 'border-border bg-card',
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between border-b px-4 py-2.5',
        highlight && !isOver && 'bg-primary/5',
      )}>
        <div className="flex items-center gap-2.5">
          {numberBadge != null && (
            <span className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
              highlight
                ? 'bg-primary'
                : isPast
                  ? 'bg-muted text-muted-foreground'
                  : [
                      'bg-blue-500',
                      'bg-violet-500',
                      'bg-amber-500',
                      'bg-emerald-500',
                      'bg-rose-500',
                      'bg-cyan-500',
                    ][(numberBadge - 1) % 6],
            )}>
              {isPast ? <CheckCircle2 className="h-3.5 w-3.5" /> : numberBadge}
            </span>
          )}
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {badge && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              {badge}
            </span>
          )}
        </div>
        <span className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium',
          assignments.length > 0
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground',
        )}>
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
