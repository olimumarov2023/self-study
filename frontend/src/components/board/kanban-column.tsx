import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { COLUMN_LABELS } from '@/queries/use-board';
import { LearningCard } from '@/components/board/learning-card';

import type { LearnStatus } from '@/types/enums';
import type { BoardItem } from '@/types/board.types';

interface KanbanColumnProps {
  status: LearnStatus;
  items: BoardItem[];
}

export function KanbanColumn({ status, items }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const itemIds = items.map((item) => item.id);

  return (
    <div className="flex w-64 shrink-0 flex-col rounded-lg bg-muted/50">
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-sm font-semibold">
          {COLUMN_LABELS[status] ?? status}
        </h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {items.length}
        </span>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`min-h-[120px] flex-1 space-y-0 overflow-y-auto px-2 pb-2 transition-colors ${
          isOver ? 'bg-primary/5 ring-2 ring-inset ring-primary/20' : ''
        }`}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <LearningCard key={item.id} item={item} />
          ))}
        </SortableContext>

        {items.length === 0 && (
          <div className="flex h-20 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
            Drop items here
          </div>
        )}
      </div>
    </div>
  );
}
