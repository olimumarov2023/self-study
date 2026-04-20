import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { KanbanColumn } from '@/components/board/kanban-column';
import { LearningCard } from '@/components/board/learning-card';
import { BOARD_COLUMNS, useDragItem } from '@/queries/use-board';
import { LearnStatus } from '@/types/enums';

import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import type { BoardItem, BoardResponse } from '@/types/board.types';

interface KanbanBoardProps {
  data: BoardResponse;
  date: string;
  search: string;
  categoryId: string;
  onItemClick?: (item: BoardItem) => void;
}

export function KanbanBoard({ data, date, search, categoryId, onItemClick }: KanbanBoardProps) {
  const [activeItem, setActiveItem] = useState<BoardItem | null>(null);
  const dragMutation = useDragItem();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Build filtered columns from response data
  const columns = useMemo(() => {
    const result: Record<string, BoardItem[]> = {};
    const searchLower = search.toLowerCase();

    for (const status of BOARD_COLUMNS) {
      const items = data.columns[status] ?? [];
      const filtered = items.filter((item) => {
        if (categoryId && categoryId !== 'all' && item.category?.id !== categoryId) {
          return false;
        }
        if (search && !item.title.toLowerCase().includes(searchLower)) {
          return false;
        }
        return true;
      });
      result[status] = filtered;
    }

    return result;
  }, [data.columns, search, categoryId]);

  // Find which column an item belongs to
  const findItemColumn = useCallback(
    (itemId: string): LearnStatus | undefined => {
      for (const status of BOARD_COLUMNS) {
        const items = columns[status];
        if (items?.some((item) => item.id === itemId)) {
          return status;
        }
      }
      return undefined;
    },
    [columns],
  );

  // Find item by id across all columns
  const findItem = useCallback(
    (itemId: string): BoardItem | undefined => {
      for (const status of BOARD_COLUMNS) {
        const item = columns[status]?.find((i) => i.id === itemId);
        if (item) return item;
      }
      return undefined;
    },
    [columns],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const item = findItem(String(event.active.id));
      setActiveItem(item ?? null);
    },
    [findItem],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveItem(null);

      const { active, over } = event;
      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      // Determine the target column status
      let targetStatus: LearnStatus | undefined;

      // Check if we dropped over a column (droppable id is the status)
      if (BOARD_COLUMNS.includes(overId as LearnStatus)) {
        targetStatus = overId as LearnStatus;
      } else {
        // Dropped over another item - find which column it's in
        targetStatus = findItemColumn(overId);
      }

      if (!targetStatus) return;

      const sourceStatus = findItemColumn(activeId);
      if (!sourceStatus) return;

      // If dropped in the same column and same position, do nothing
      if (sourceStatus === targetStatus && activeId === overId) return;

      // Calculate the new rank
      const targetItems = columns[targetStatus] ?? [];
      let newRank = 0;

      if (overId === targetStatus || targetItems.length === 0) {
        // Dropped on the column itself or empty column -- place at end
        newRank = targetItems.length;
      } else {
        // Dropped over a specific item -- place at its position
        const overIndex = targetItems.findIndex((item) => item.id === overId);
        newRank = overIndex >= 0 ? overIndex : targetItems.length;
      }

      dragMutation.mutate({
        learningItemId: activeId,
        date,
        newStatus: targetStatus,
        newRank,
      });
    },
    [findItemColumn, columns, dragMutation, date],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {BOARD_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            items={columns[status] ?? []}
            onItemClick={onItemClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="w-64 rotate-2 scale-105">
            <LearningCard item={activeItem} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
