import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

import type { LearningItem } from '@/types/learning-item.types';

interface DraggableChipProps {
  item: LearningItem;
  onClick?: (item: LearningItem) => void;
}

export function DraggableChip({ item, onClick }: DraggableChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `chip-${item.id}`,
    data: { item },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${
        isDragging ? 'opacity-0' : ''
      }`}
      onClick={() => onClick?.(item)}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      {item.category && (
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: item.category.color ?? '#6b7280' }}
        />
      )}
      <span className="truncate font-medium">{item.title}</span>
    </div>
  );
}
