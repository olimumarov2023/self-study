import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLearningItems } from '@/queries/use-learning-items';
import { useAssignItem } from '@/queries/use-planning';
import { Priority } from '@/types/enums';

import type { LearningItem } from '@/types/learning-item.types';
import type { PlanAssignment } from '@/types/planning.types';

interface AssignItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: 'MONTHLY' | 'WEEKLY' | 'DAILY';
  periodKey: string;
  existingAssignments: PlanAssignment[];
  /** Optional filter for parent-level items (e.g. monthly items for week assignment) */
  parentAssignments?: PlanAssignment[];
}

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [Priority.HIGH]: 'destructive',
  [Priority.MEDIUM]: 'default',
  [Priority.LOW]: 'secondary',
};

const LEVEL_LABEL: Record<string, string> = {
  MONTHLY: 'month',
  WEEKLY: 'week',
  DAILY: 'day',
};

export function AssignItemsDialog({
  open,
  onOpenChange,
  level,
  periodKey,
  existingAssignments,
  parentAssignments,
}: AssignItemsDialogProps) {
  const [search, setSearch] = useState('');
  const assignItem = useAssignItem();

  // Fetch all backlog items for selection
  const { data: allItems, isLoading } = useLearningItems({
    limit: 100,
    offset: 0,
    search: search || undefined,
  });

  const existingItemIds = new Set(existingAssignments.map((a) => a.learningItemId));

  // If we have parent assignments, only show those items. Otherwise show all.
  let availableItems: LearningItem[] = [];
  if (parentAssignments) {
    const parentItemIds = new Set(parentAssignments.map((a) => a.learningItemId));
    availableItems = (allItems?.data ?? []).filter(
      (item) => parentItemIds.has(item.id) && !existingItemIds.has(item.id),
    );
  } else {
    availableItems = (allItems?.data ?? []).filter(
      (item) => !existingItemIds.has(item.id),
    );
  }

  function handleAssign(item: LearningItem) {
    assignItem.mutate({
      learningItemId: item.id,
      level,
      periodKey,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-hidden flex flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Assign items to this {LEVEL_LABEL[level] ?? level}
          </DialogTitle>
          <DialogDescription>
            Click an item to assign it to <strong>{periodKey}</strong>.
            {parentAssignments
              ? ' Showing items from the parent planning level.'
              : ' Showing all backlog items.'}
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />

        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && availableItems.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No available items to assign.
            </p>
          )}

          {availableItems.map((item) => (
            <button
              key={item.id}
              className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50 disabled:opacity-50"
              onClick={() => handleAssign(item)}
              disabled={assignItem.isPending}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{item.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  {item.category && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.category.color ?? '#6b7280' }}
                      />
                      {item.category.name}
                    </span>
                  )}
                  <Badge
                    variant={PRIORITY_VARIANT[item.priority] ?? 'secondary'}
                    className="text-xs"
                  >
                    {item.priority}
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
