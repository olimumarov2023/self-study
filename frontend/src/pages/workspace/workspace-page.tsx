import { useState, useCallback } from 'react';
import { Plus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuickAddModal } from '@/components/learning-items/quick-add-modal';
import { LearningItemForm } from '@/components/learning-items/learning-item-form';
import { DraggableItemCard, DragOverlayCard } from '@/components/planning/draggable-item-card';
import {
  useCreateLearningItem,
  useUpdateLearningItem,
  useDeleteLearningItem,
} from '@/queries/use-learning-items';
import { useMonthPlan, useWeekPlan, useAssignItem } from '@/queries/use-planning';
import { MonthPlannerView } from '@/pages/planner/month-planner-view';
import { WeekPlannerView } from '@/pages/planner/week-planner-view';
import { DayPlannerView } from '@/pages/planner/day-planner-view';
import { Loader2 } from 'lucide-react';

import type { LearningItem } from '@/types/learning-item.types';

export function WorkspacePage() {
  const [activeTab, setActiveTab] = useState('month');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<LearningItem | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMonthKey, setActiveMonthKey] = useState('');
  const [activeWeekKey, setActiveWeekKey] = useState('');
  const [activeDayKey, setActiveDayKey] = useState('');
  const [draggedItem, setDraggedItem] = useState<LearningItem | null>(null);

  // Monthly assignments (source for week tab)
  const { data: monthAssignments, isLoading: monthLoading } = useMonthPlan(activeMonthKey);

  // Weekly assignments (source for day tab)
  const { data: weekAssignments, isLoading: weekLoading } = useWeekPlan(activeWeekKey);

  const createItem = useCreateLearningItem();
  const updateItem = useUpdateLearningItem();
  const deleteItem = useDeleteLearningItem();
  const assignItem = useAssignItem();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleMonthChange = useCallback((monthKey: string) => {
    setActiveMonthKey(monthKey);
  }, []);

  const handleWeekChange = useCallback((weekKey: string) => {
    setActiveWeekKey(weekKey);
  }, []);

  const handleDayChange = useCallback((dayKey: string) => {
    setActiveDayKey(dayKey);
  }, []);

  function handleDragStart(event: DragStartEvent) {
    const item = event.active.data.current?.item as LearningItem | undefined;
    if (item) setDraggedItem(item);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggedItem(null);
    const { active, over } = event;
    if (!over) return;

    const droppedItem = active.data.current?.item as LearningItem | undefined;
    if (!droppedItem) return;

    const overId = String(over.id);

    if (overId.startsWith('month:')) {
      assignItem.mutate({
        learningItemId: droppedItem.id,
        level: 'MONTHLY',
        periodKey: overId.replace('month:', ''),
      });
      return;
    }

    if (overId.startsWith('week:')) {
      assignItem.mutate({
        learningItemId: droppedItem.id,
        level: 'WEEKLY',
        periodKey: overId.replace('week:', ''),
      });
      return;
    }

    if (overId.startsWith('day:')) {
      assignItem.mutate({
        learningItemId: droppedItem.id,
        level: 'DAILY',
        periodKey: overId.replace('day:', ''),
      });
      return;
    }
  }

  function handleItemClick(item: LearningItem) {
    setEditItem(item);
  }

  function handleQuickAdd(payload: Parameters<typeof createItem.mutate>[0]) {
    createItem.mutate(payload, {
      onSuccess: (created) => {
        setQuickAddOpen(false);
        // Auto-assign to the active period
        if (activeTab === 'month' && activeMonthKey) {
          assignItem.mutate({
            learningItemId: created.id,
            level: 'MONTHLY',
            periodKey: activeMonthKey,
          });
        } else if (activeTab === 'day' && activeDayKey) {
          assignItem.mutate({
            learningItemId: created.id,
            level: 'DAILY',
            periodKey: activeDayKey,
          });
        }
      },
    });
  }

  // Sidebar only shown on week & day tabs
  const showSidebar = activeTab === 'week' || activeTab === 'day';
  const isWeekTab = activeTab === 'week';
  const isDayTab = activeTab === 'day';

  const sidebarTitle = isWeekTab ? 'Monthly Items' : 'Weekly Items';
  const sidebarSubtitle = isWeekTab
    ? 'Drag items to a week'
    : 'Drag items to the day';

  const sourceItems: LearningItem[] | undefined = isWeekTab
    ? monthAssignments?.map((a) => a.learningItem)
    : isDayTab
      ? weekAssignments?.map((a) => a.learningItem)
      : undefined;
  const sourceLoading = isWeekTab ? monthLoading : weekLoading;

  // Show "Add Item" on month and day tabs
  const showAddButton = activeTab === 'month' || activeTab === 'day';

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4">
        {/* Left Panel — Drag Source (only for week & day tabs) */}
        {showSidebar && (
          <div
            className={`flex flex-col border-r pr-4 transition-all duration-200 ${
              sidebarCollapsed ? 'w-10' : 'w-[420px] min-w-[320px]'
            }`}
          >
            {sidebarCollapsed ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(false)}
                title="Show items"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{sidebarTitle}</h2>
                    <p className="text-xs text-muted-foreground">{sidebarSubtitle}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarCollapsed(true)}
                    title="Collapse"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </div>

                {/* Draggable items list */}
                <div className="mt-2 flex-1 space-y-2 overflow-y-auto">
                  {sourceLoading && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {!sourceLoading && (!sourceItems || sourceItems.length === 0) && (
                    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                      {isWeekTab
                        ? 'No items assigned to this month yet.'
                        : 'No items assigned to this week yet.'}
                    </div>
                  )}

                  {!sourceLoading &&
                    sourceItems?.map((item) => (
                      <DraggableItemCard
                        key={item.id}
                        item={item}
                        onClick={handleItemClick}
                      />
                    ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Right Panel — Planner */}
        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Planner</h2>
              <div className="flex items-center gap-2">
                {showAddButton && (
                  <Button size="sm" onClick={() => setQuickAddOpen(true)}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Item
                  </Button>
                )}
                <TabsList>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="day">Day</TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="month">
              <MonthPlannerView onMonthChange={handleMonthChange} onItemClick={handleItemClick} />
            </TabsContent>

            <TabsContent value="week">
              <WeekPlannerView onMonthChange={handleMonthChange} onItemClick={handleItemClick} />
            </TabsContent>

            <TabsContent value="day">
              <DayPlannerView onWeekChange={handleWeekChange} onDayChange={handleDayChange} onItemClick={handleItemClick} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        {draggedItem && <DragOverlayCard item={draggedItem} />}
      </DragOverlay>

      {/* Modals */}
      <QuickAddModal
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onSubmit={handleQuickAdd}
        isPending={createItem.isPending}
      />

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
    </DndContext>
  );
}
