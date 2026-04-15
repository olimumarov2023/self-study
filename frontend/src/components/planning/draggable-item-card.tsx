import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, BarChart3 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Priority } from '@/types/enums';

import type { LearningItem } from '@/types/learning-item.types';

interface DraggableItemCardProps {
  item: LearningItem;
  onClick?: (item: LearningItem) => void;
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

export function DraggableItemCard({ item, onClick }: DraggableItemCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? 'z-50 shadow-lg ring-2 ring-primary/50' : ''
      }`}
      onClick={() => onClick?.(item)}
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

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              {item.category && (
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.category.color ?? '#6b7280' }}
                  title={item.category.name}
                />
              )}
              <span className="truncate text-sm font-medium">{item.title}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant={PRIORITY_VARIANT[item.priority] ?? 'secondary'}
                className="px-1.5 py-0 text-[10px]"
              >
                {PRIORITY_LABEL[item.priority] ?? item.priority}
              </Badge>

              {item.estimatedHours != null && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {item.estimatedHours}h
                </span>
              )}

              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <BarChart3 className="h-2.5 w-2.5" />
                {item.difficulty}/5
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Overlay version rendered during drag — no DnD hooks, just visual */
export function DragOverlayCard({ item }: { item: LearningItem }) {
  return (
    <Card className="w-[340px] rotate-2 scale-105 shadow-xl ring-2 ring-primary/50">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              {item.category && (
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.category.color ?? '#6b7280' }}
                />
              )}
              <span className="truncate text-sm font-medium">{item.title}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge
                variant={PRIORITY_VARIANT[item.priority] ?? 'secondary'}
                className="px-1.5 py-0 text-[10px]"
              >
                {PRIORITY_LABEL[item.priority] ?? item.priority}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
