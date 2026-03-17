import { Loader2 } from 'lucide-react';

import { LearningItemCard } from '@/components/learning-items/learning-item-card';

import type { LearningItem } from '@/types/learning-item.types';

interface LearningItemListProps {
  items: LearningItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onItemClick: (item: LearningItem) => void;
}

export function LearningItemList({
  items,
  isLoading,
  isError,
  onItemClick,
}: LearningItemListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        Failed to load learning items. Please try again.
      </p>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        No learning items found. Add your first topic to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <LearningItemCard key={item.id} item={item} onClick={onItemClick} />
      ))}
    </div>
  );
}
