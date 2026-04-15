import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CheckCircle2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { LearnStatus } from '@/types/enums';

import type { BoardItem } from '@/types/board.types';

interface LearningCardProps {
  item: BoardItem;
  onClick?: (item: BoardItem) => void;
}

export function LearningCard({ item, onClick }: LearningCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const isCompleted = item.status === LearnStatus.LEARNED;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`mb-2 cursor-grab active:cursor-grabbing ${isDragging ? 'z-50 shadow-lg ring-2 ring-primary/50' : ''}`}
      onClick={() => onClick?.(item)}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <button
            className="shrink-0 cursor-grab text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {isCompleted && (
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
      </CardContent>
    </Card>
  );
}
