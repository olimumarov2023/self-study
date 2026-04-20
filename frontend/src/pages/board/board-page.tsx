import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';

import { KanbanBoard } from '@/components/board/kanban-board';
import { BoardFilters } from '@/components/board/board-filters';
import { LearningItemForm } from '@/components/learning-items/learning-item-form';
import { DatePicker } from '@/components/ui/date-picker';
import { useDateBoard } from '@/queries/use-board';
import { useUpdateLearningItem, useDeleteLearningItem } from '@/queries/use-learning-items';
import { cn } from '@/lib/utils';

import type { BoardItem } from '@/types/board.types';
import type { LearningItem } from '@/types/learning-item.types';

function toDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getNext7Days(): Array<{ dateStr: string; dayName: string; dayNum: number; isToday: boolean }> {
  const today = new Date();
  const days: Array<{ dateStr: string; dayName: string; dayNum: number; isToday: boolean }> = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      dateStr: toDateString(d),
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: i === 0,
    });
  }
  return days;
}

function boardItemToLearningItem(item: BoardItem): LearningItem {
  return {
    id: item.id,
    userId: '',
    categoryId: item.category?.id ?? null,
    parentId: null,
    title: item.title,
    description: item.description,
    notes: null,
    priority: item.priority,
    difficulty: item.difficulty,
    estimatedHours: item.estimatedHours,
    status: item.status,
    dueDate: null,
    targetRole: null,
    tags: item.tags,
    sortOrder: 0,
    createdAt: '',
    updatedAt: '',
    category: item.category ? { id: item.category.id, userId: '', name: item.category.name, color: item.category.color, weightGoal: null, createdAt: '', updatedAt: '' } : null,
  };
}

export function BoardPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [editItem, setEditItem] = useState<LearningItem | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => toDateString(new Date()));

  const next7 = useMemo(() => getNext7Days(), []);
  const isQuickDay = next7.some((d) => d.dateStr === selectedDate);

  const dateQuery = useDateBoard(selectedDate);
  const updateItem = useUpdateLearningItem();
  const deleteItem = useDeleteLearningItem();

  function handleItemClick(item: BoardItem) {
    setEditItem(boardItemToLearningItem(item));
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Board</h1>
        <p className="text-muted-foreground">
          Drag items between columns to update their status.
        </p>
      </div>

      {/* Day selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {next7.map((day) => (
          <button
            key={day.dateStr}
            onClick={() => setSelectedDate(day.dateStr)}
            className={cn(
              'flex flex-col items-center rounded-lg border px-3 py-2 text-xs font-medium transition-colors min-w-[60px]',
              selectedDate === day.dateStr
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <span className="text-[11px]">{day.dayName}</span>
            <span className="text-lg font-bold">{day.dayNum}</span>
          </button>
        ))}
        <div className={cn('ml-1', !isQuickDay && 'ring-2 ring-primary rounded-lg')}>
          <DatePicker value={selectedDate} onChange={setSelectedDate} />
        </div>
      </div>

      <BoardFilters
        search={search}
        onSearchChange={setSearch}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
      />

      {/* Board */}
      <div>
        {dateQuery.isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {dateQuery.isError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load board. Please try again.
          </div>
        )}
        {dateQuery.data && (
          <KanbanBoard
            data={dateQuery.data}
            date={selectedDate}
            search={search}
            categoryId={categoryId}
            onItemClick={handleItemClick}
          />
        )}
      </div>

      {editItem && (
        <LearningItemForm
          open={!!editItem}
          onOpenChange={(open) => {
            if (!open) setEditItem(null);
          }}
          item={editItem}
          onSubmit={(id, payload) => {
            updateItem.mutate(
              { id, data: payload },
              { onSuccess: () => setEditItem(null) },
            );
          }}
          onDelete={(id) => {
            deleteItem.mutate(id, {
              onSuccess: () => setEditItem(null),
            });
          }}
          isPending={updateItem.isPending || deleteItem.isPending}
        />
      )}
    </div>
  );
}
