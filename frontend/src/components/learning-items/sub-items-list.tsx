import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  useSubItems,
  useCreateSubItem,
  useDeleteSubItem,
  useMoveSubItemStatus,
} from '@/queries/use-learning-items';
import { LearnStatus } from '@/types/enums';

import type { SubItem } from '@/types/learning-item.types';

interface SubItemsListProps {
  parentId: string;
}

const STATUS_ICON: Record<string, { icon: typeof CheckCircle2; className: string }> = {
  [LearnStatus.LEARNED]: { icon: CheckCircle2, className: 'text-green-500' },
  [LearnStatus.IN_PROGRESS]: { icon: Circle, className: 'text-blue-500 fill-blue-500/20' },
};

export function SubItemsList({ parentId }: SubItemsListProps) {
  const [newTitle, setNewTitle] = useState('');

  const { data: subItems, isLoading } = useSubItems(parentId);
  const createSubItem = useCreateSubItem();
  const deleteSubItem = useDeleteSubItem();
  const moveStatus = useMoveSubItemStatus();

  function handleAdd() {
    const title = newTitle.trim();
    if (!title) return;
    createSubItem.mutate(
      { parentId, data: { title } },
      { onSuccess: () => setNewTitle('') },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  function handleToggleStatus(sub: SubItem) {
    const nextStatus = sub.status === LearnStatus.LEARNED
      ? LearnStatus.TO_LEARN
      : LearnStatus.LEARNED;
    moveStatus.mutate({ parentId, subId: sub.id, status: nextStatus });
  }

  function handleDelete(subId: string) {
    deleteSubItem.mutate({ parentId, subId });
  }

  const doneCount = subItems?.filter((s) => s.status === LearnStatus.LEARNED).length ?? 0;
  const totalCount = subItems?.length ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          Sub-items
          {totalCount > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {doneCount}/{totalCount} done
            </span>
          )}
        </h4>
        {totalCount > 0 && (
          <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${(doneCount / totalCount) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Add new sub-item */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a sub-item..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={!newTitle.trim() || createSubItem.isPending}
          className="h-8 px-2"
        >
          {createSubItem.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* List */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && subItems && subItems.length > 0 && (
        <ul className="space-y-1">
          {subItems.map((sub) => {
            const isLearned = sub.status === LearnStatus.LEARNED;
            const statusEntry = STATUS_ICON[sub.status];
            const Icon = statusEntry?.icon ?? Circle;
            const iconClass = statusEntry?.className ?? 'text-muted-foreground';

            return (
              <li
                key={sub.id}
                className="group flex items-center gap-2 rounded-md border px-3 py-2 transition-colors hover:bg-accent/50"
              >
                <button
                  type="button"
                  onClick={() => handleToggleStatus(sub)}
                  disabled={moveStatus.isPending}
                  className="flex-shrink-0"
                >
                  <Icon className={`h-4 w-4 ${iconClass}`} />
                </button>

                <span
                  className={`flex-1 text-sm truncate ${isLearned ? 'line-through text-muted-foreground' : ''}`}
                >
                  {sub.title}
                </span>

                {isLearned && (
                  <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">
                    Done
                  </Badge>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(sub.id)}
                  disabled={deleteSubItem.isPending}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!isLoading && subItems && subItems.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No sub-items yet. Add one above.
        </p>
      )}
    </div>
  );
}
