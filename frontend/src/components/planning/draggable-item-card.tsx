import { GripVertical } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

import type { LearningItem } from '@/types/learning-item.types';

/** Overlay version rendered during drag */
export function DragOverlayCard({ item }: { item: LearningItem }) {
  return (
    <Card className="w-[280px] rotate-2 scale-105 shadow-xl ring-2 ring-primary/50">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
          {item.category && (
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.category.color ?? '#6b7280' }}
            />
          )}
          <span className="truncate text-sm font-medium">{item.title}</span>
        </div>
      </CardContent>
    </Card>
  );
}
