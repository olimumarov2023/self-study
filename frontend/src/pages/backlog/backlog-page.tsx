import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BacklogFilters } from '@/components/learning-items/backlog-filters';
import { LearningItemList } from '@/components/learning-items/learning-item-list';
import { QuickAddModal } from '@/components/learning-items/quick-add-modal';
import { LearningItemForm } from '@/components/learning-items/learning-item-form';
import {
  useLearningItems,
  useCreateLearningItem,
  useUpdateLearningItem,
  useDeleteLearningItem,
} from '@/queries/use-learning-items';

import type { LearningItem, LearningItemsQuery } from '@/types/learning-item.types';

export function BacklogPage() {
  const [filters, setFilters] = useState<LearningItemsQuery>({ limit: 20, offset: 0 });
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<LearningItem | null>(null);

  const { data, isLoading, isError } = useLearningItems(filters);
  const createItem = useCreateLearningItem();
  const updateItem = useUpdateLearningItem();
  const deleteItem = useDeleteLearningItem();

  function handleItemClick(item: LearningItem) {
    setEditItem(item);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backlog</h1>
          <p className="text-muted-foreground">
            All future learning topics. Filter by category, status, or priority.
          </p>
        </div>
        <Button onClick={() => setQuickAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <BacklogFilters filters={filters} onFiltersChange={setFilters} />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {data && (
          <span>
            Showing {data.data.length} of {data.total} items
          </span>
        )}
        {data && data.total > (filters.limit ?? 20) && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={(filters.offset ?? 0) === 0}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  offset: Math.max(0, (prev.offset ?? 0) - (prev.limit ?? 20)),
                }))
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={
                (filters.offset ?? 0) + (filters.limit ?? 20) >= data.total
              }
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  offset: (prev.offset ?? 0) + (prev.limit ?? 20),
                }))
              }
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <LearningItemList
        items={data?.data}
        isLoading={isLoading}
        isError={isError}
        onItemClick={handleItemClick}
      />

      <QuickAddModal
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onSubmit={(payload) => {
          createItem.mutate(payload, {
            onSuccess: () => setQuickAddOpen(false),
          });
        }}
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
    </div>
  );
}
