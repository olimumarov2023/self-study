import { CheckCircle2, ArrowRight, Circle, AlertTriangle, BookOpen } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LearnStatus } from '@/types/enums';
import { useDragItem } from '@/queries/use-board';

import type { BoardItem } from '@/types/board.types';

interface TodayItemsListProps {
  items: BoardItem[];
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  [LearnStatus.LEARNED]: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  [LearnStatus.IN_PROGRESS]: <ArrowRight className="h-4 w-4 text-blue-500" />,
  [LearnStatus.PLANNED]: <Circle className="h-4 w-4 text-yellow-500" />,
  [LearnStatus.TO_LEARN]: <Circle className="h-4 w-4 text-muted-foreground" />,
  [LearnStatus.NEEDS_REVISION]: <AlertTriangle className="h-4 w-4 text-orange-500" />,
};

/** Returns the next logical status for a quick toggle */
function getNextStatus(current: string): LearnStatus | null {
  switch (current) {
    case LearnStatus.TO_LEARN:
      return LearnStatus.IN_PROGRESS;
    case LearnStatus.PLANNED:
      return LearnStatus.IN_PROGRESS;
    case LearnStatus.IN_PROGRESS:
      return LearnStatus.LEARNED;
    case LearnStatus.NEEDS_REVISION:
      return LearnStatus.IN_PROGRESS;
    default:
      return null;
  }
}

export function TodayItemsList({ items }: TodayItemsListProps) {
  const dragMutation = useDragItem();

  const handleToggle = (item: BoardItem) => {
    const next = getNextStatus(item.status);
    if (!next) return;
    dragMutation.mutate({
      learningItemId: item.id,
      newStatus: next,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <BookOpen className="h-4 w-4" />
          Today's Items
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No items planned for today. Add some from the Planner!
          </p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => {
              const nextStatus = getNextStatus(item.status);
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/50"
                >
                  <span className="shrink-0">
                    {STATUS_ICON[item.status] ?? <Circle className="h-4 w-4" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-sm ${item.status === LearnStatus.LEARNED ? 'text-muted-foreground line-through' : ''}`}
                    >
                      {item.title}
                    </span>
                    {item.category && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: item.category.color ?? '#6b7280' }}
                        />
                        {item.category.name}
                      </span>
                    )}
                  </div>

                  {nextStatus && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 px-2 text-xs"
                      onClick={() => handleToggle(item)}
                      disabled={dragMutation.isPending}
                    >
                      {nextStatus === LearnStatus.IN_PROGRESS && 'Start'}
                      {nextStatus === LearnStatus.LEARNED && 'Done'}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
