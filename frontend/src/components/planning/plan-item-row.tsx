import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CheckCircle2 } from 'lucide-react';

import { LearnStatus } from '@/types/enums';

import type { PlanAssignment } from '@/types/planning.types';
import type { LearningItem } from '@/types/learning-item.types';

interface PlanItemRowProps {
  assignment: PlanAssignment;
  showStatus?: boolean;
  onItemClick?: (item: LearningItem) => void;
}

export function PlanItemRow({ assignment, showStatus = false, onItemClick }: PlanItemRowProps) {
  const item = assignment.learningItem;
  const isCompleted = item.status === LearnStatus.LEARNED;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `row-${assignment.id}`,
    data: { item },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50 cursor-pointer ${
        isDragging ? 'opacity-0' : ''
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

        {item.category && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: item.category.color ?? '#6b7280' }}
            />
            {item.category.name}
          </div>
        )}
      </div>
    </div>
  );
}
