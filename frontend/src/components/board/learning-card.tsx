import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, BarChart3, GripVertical } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Priority } from '@/types/enums';

import type { BoardItem } from '@/types/board.types';

interface LearningCardProps {
  item: BoardItem;
}

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [Priority.HIGH]: 'destructive',
  [Priority.MEDIUM]: 'default',
  [Priority.LOW]: 'secondary',
};

const PRIORITY_LABEL: Record<string, string> = {
  [Priority.HIGH]: 'High',
  [Priority.MEDIUM]: 'Med',
  [Priority.LOW]: 'Low',
};

function getDifficultyLabel(difficulty: number): string {
  const labels = ['', 'Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
  return labels[difficulty] ?? `${difficulty}/5`;
}

export function LearningCard({ item }: LearningCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`mb-2 cursor-grab active:cursor-grabbing ${isDragging ? 'z-50 shadow-lg ring-2 ring-primary/50' : ''}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <button
            className="mt-0.5 shrink-0 cursor-grab text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Title row with category dot */}
            <div className="flex items-center gap-1.5">
              {item.category && (
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.category.color ?? '#6b7280' }}
                  title={item.category.name}
                />
              )}
              <span className="truncate text-sm font-medium leading-snug">
                {item.title}
              </span>
            </div>

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant={PRIORITY_VARIANT[item.priority] ?? 'secondary'}
                className="px-1.5 py-0 text-[10px]"
              >
                {PRIORITY_LABEL[item.priority] ?? item.priority}
              </Badge>

              <Badge variant="outline" className="gap-0.5 px-1.5 py-0 text-[10px]">
                <BarChart3 className="h-2.5 w-2.5" />
                {getDifficultyLabel(item.difficulty)}
              </Badge>

              {item.estimatedHours != null && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {item.estimatedHours}h
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
