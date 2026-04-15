import { useState, useCallback } from 'react';
import { Plus, CalendarDays, CalendarRange, Calendar, ArrowDown, Loader2 } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';

import { Button } from '@/components/ui/button';
import { QuickAddModal } from '@/components/learning-items/quick-add-modal';
import { LearningItemForm } from '@/components/learning-items/learning-item-form';
import { DragOverlayCard } from '@/components/planning/draggable-item-card';
import { DraggableChip } from '@/components/planning/draggable-chip';
import {
  useCreateLearningItem,
  useUpdateLearningItem,
  useDeleteLearningItem,
} from '@/queries/use-learning-items';
import { useMonthPlan, useWeekPlan, useAssignItem } from '@/queries/use-planning';
import { MonthPlannerView } from '@/pages/planner/month-planner-view';
import { WeekPlannerView } from '@/pages/planner/week-planner-view';
import { DayPlannerView } from '@/pages/planner/day-planner-view';
import { cn } from '@/lib/utils';

import type { LearningItem } from '@/types/learning-item.types';

const STEPS = [
  { id: 'month', label: 'Month', icon: CalendarDays, description: 'Plan what to learn this month' },
  { id: 'week', label: 'Week', icon: CalendarRange, description: 'Break monthly items into weeks' },
  { id: 'day', label: 'Day', icon: Calendar, description: 'Pick what to work on today' },
] as const;

export function WorkspacePage() {
  const [activeTab, setActiveTab] = useState('month');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<LearningItem | null>(null);
  const [activeMonthKey, setActiveMonthKey] = useState('');
  const [activeWeekKey, setActiveWeekKey] = useState('');
  const [activeDayKey, setActiveDayKey] = useState('');
  const [addTargetWeekKey, setAddTargetWeekKey] = useState('');
  const [draggedItem, setDraggedItem] = useState<LearningItem | null>(null);

  // Source data for strips
  const { data: monthAssignments, isLoading: monthLoading } = useMonthPlan(activeMonthKey);
  const { data: weekAssignments, isLoading: weekLoading } = useWeekPlan(activeWeekKey);

  const createItem = useCreateLearningItem();
  const updateItem = useUpdateLearningItem();
  const deleteItem = useDeleteLearningItem();
  const assignItem = useAssignItem();

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
      assignItem.mutate({ learningItemId: droppedItem.id, level: 'MONTHLY', periodKey: overId.replace('month:', '') });
      return;
    }
    if (overId.startsWith('week:')) {
      assignItem.mutate({ learningItemId: droppedItem.id, level: 'WEEKLY', periodKey: overId.replace('week:', '') });
      return;
    }
    if (overId.startsWith('day:')) {
      assignItem.mutate({ learningItemId: droppedItem.id, level: 'DAILY', periodKey: overId.replace('day:', '') });
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
        if (addTargetWeekKey) {
          assignItem.mutate({ learningItemId: created.id, level: 'WEEKLY', periodKey: addTargetWeekKey });
          setAddTargetWeekKey('');
        } else if (activeTab === 'month' && activeMonthKey) {
          assignItem.mutate({ learningItemId: created.id, level: 'MONTHLY', periodKey: activeMonthKey });
        } else if (activeTab === 'day' && activeDayKey) {
          assignItem.mutate({ learningItemId: created.id, level: 'DAILY', periodKey: activeDayKey });
        }
      },
    });
  }

  function handleWeekAddItem(weekKey: string) {
    setAddTargetWeekKey(weekKey);
    setQuickAddOpen(true);
  }

  const activeStep = STEPS.find((s) => s.id === activeTab)!;
  const showAddButton = activeTab === 'month' || activeTab === 'day';

  // Source items for the horizontal strip
  const sourceItems: LearningItem[] | undefined =
    activeTab === 'week'
      ? monthAssignments?.map((a) => a.learningItem)
      : activeTab === 'day'
        ? weekAssignments?.map((a) => a.learningItem)
        : undefined;
  const sourceLoading = activeTab === 'week' ? monthLoading : weekLoading;
  const sourceLabel = activeTab === 'week' ? 'Monthly items' : 'Weekly items';

  // Droppable ID for the source strip — dropping here moves item back up a level
  const sourceDropId =
    activeTab === 'week' && activeMonthKey
      ? `month:${activeMonthKey}`
      : activeTab === 'day' && activeWeekKey
        ? `week:${activeWeekKey}`
        : '';

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* ── Step indicator ── */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab(step.id)}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                  activeTab === step.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <step.icon className="h-4 w-4" />
                {step.label}
              </button>
              {i < STEPS.length - 1 && (
                <ArrowDown className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />
              )}
            </div>
          ))}
        </div>

        {/* ── Description + actions ── */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{activeStep.description}</p>
          {showAddButton && (
            <Button size="sm" onClick={() => setQuickAddOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Item
            </Button>
          )}
        </div>

        {/* ── Source strip (week & day tabs) ── */}
        {(activeTab === 'week' || activeTab === 'day') && (
          <SourceStrip
            droppableId={sourceDropId}
            label={sourceLabel}
            items={sourceItems}
            isLoading={sourceLoading}
            emptyMessage={
              activeTab === 'week'
                ? 'No monthly items yet. Go to Month tab to add items first.'
                : 'No weekly items yet. Go to Week tab to assign items first.'
            }
            onItemClick={handleItemClick}
          />
        )}

        {/* ── Planner content ── */}
        {activeTab === 'month' && (
          <MonthPlannerView onMonthChange={handleMonthChange} onItemClick={handleItemClick} />
        )}
        {activeTab === 'week' && (
          <WeekPlannerView onMonthChange={handleMonthChange} onItemClick={handleItemClick} onAddItem={handleWeekAddItem} />
        )}
        {activeTab === 'day' && (
          <DayPlannerView onWeekChange={handleWeekChange} onDayChange={handleDayChange} onItemClick={handleItemClick} />
        )}
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        {draggedItem && <DragOverlayCard item={draggedItem} />}
      </DragOverlay>

      {/* Modals */}
      <QuickAddModal
        open={quickAddOpen}
        onOpenChange={(open) => {
          setQuickAddOpen(open);
          if (!open) setAddTargetWeekKey('');
        }}
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

/* ── Source strip with droppable zone ── */

interface SourceStripProps {
  droppableId: string;
  label: string;
  items: LearningItem[] | undefined;
  isLoading: boolean;
  emptyMessage: string;
  onItemClick: (item: LearningItem) => void;
}

function SourceStrip({ droppableId, label, items, isLoading, emptyMessage, onItemClick }: SourceStripProps) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId || 'source-strip-disabled' });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {label} — drag to assign below, or drop here to move back
        </h3>
        {items && items.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-wrap gap-2 rounded-lg border-2 border-dashed p-3 transition-colors',
          isOver
            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
            : 'border-border bg-muted/30',
        )}
      >
        {isLoading && (
          <div className="flex w-full items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && (!items || items.length === 0) && (
          <p className="w-full py-2 text-center text-sm text-muted-foreground">
            {isOver ? 'Drop here!' : emptyMessage}
          </p>
        )}
        {!isLoading &&
          items?.map((item) => (
            <DraggableChip key={item.id} item={item} onClick={onItemClick} />
          ))}
      </div>
      <div className="flex justify-center">
        <ArrowDown className="h-5 w-5 text-muted-foreground animate-bounce" />
      </div>
    </div>
  );
}
