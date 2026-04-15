import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, BarChart3, CheckCircle2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Priority, LearnStatus } from '@/types/enums';

import type { PlanAssignment } from '@/types/planning.types';
import type { LearningItem } from '@/types/learning-item.types';

interface PlanItemRowProps {
  assignment: PlanAssignment;
  showStatus?: boolean;
  onItemClick?: (item: LearningItem) => void;
}

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [Priority.HIGH]: 'destructive',
  [Priority.MEDIUM]: 'default',
  [Priority.LOW]: 'secondary',
};

const PRIORITY_LABEL: Record<string, string> = {
  [Priority.HIGH]: 'High',
  [Priority.MEDIUM]: 'Medium',
  [Priority.LOW]: 'Low',
};

export function PlanItemRow({ assignment, showStatus = false, onItemClick }: PlanItemRowProps) {
  const item = assignment.learningItem;
  const isCompleted = item.status === LearnStatus.LEARNED;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `row-${assignment.id}`,
    data: { item },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50 cursor-pointer ${
        isDragging ? 'z-50 shadow-lg ring-2 ring-primary/50' : ''
      }`}
      onClick={() => onItemClick?.(item)}
    >
      <button
        className="flex-shrink-0 text-muted-foreground cursor-grab hover:text-foreground"
        onClick={(e) => e.stopPropagation()}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {showStatus && isCompleted && (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
          )}
          <span className={`font-medium truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {item.title}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          {item.category && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: item.category.color ?? '#6b7280' }}
              />
              {item.category.name}
            </span>
          )}

          <Badge variant={PRIORITY_VARIANT[item.priority] ?? 'secondary'} className="text-xs">
            {PRIORITY_LABEL[item.priority] ?? item.priority}
          </Badge>

          {item.estimatedHours != null && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {item.estimatedHours}h
            </span>
          )}

          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <BarChart3 className="h-3 w-3" />
            {item.difficulty}/5
          </span>
        </div>
      </div>
    </div>
  );
}
