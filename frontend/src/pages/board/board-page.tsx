import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KanbanBoard } from '@/components/board/kanban-board';
import { BoardFilters } from '@/components/board/board-filters';
import { useTodayBoard, useWeekBoard } from '@/queries/use-board';

export function BoardPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');

  const todayQuery = useTodayBoard();
  const weekQuery = useWeekBoard();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Board</h1>
        <p className="text-muted-foreground">
          Drag items between columns to update their status.
        </p>
      </div>

      <BoardFilters
        search={search}
        onSearchChange={setSearch}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
      />

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          {todayQuery.isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {todayQuery.isError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              Failed to load today's board. Please try again.
            </div>
          )}
          {todayQuery.data && (
            <KanbanBoard
              data={todayQuery.data}
              search={search}
              categoryId={categoryId}
            />
          )}
        </TabsContent>

        <TabsContent value="week" className="mt-4">
          {weekQuery.isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {weekQuery.isError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              Failed to load this week's board. Please try again.
            </div>
          )}
          {weekQuery.data && (
            <KanbanBoard
              data={weekQuery.data}
              search={search}
              categoryId={categoryId}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
