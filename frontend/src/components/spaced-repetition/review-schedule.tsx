import { useState } from 'react';
import { ChevronDown, ChevronRight, CalendarDays } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReviewSchedule } from '@/queries/use-spaced-repetition';

import type { BackendScheduleDay, BackendSpacedRepetitionItem } from '@/api/spaced-repetition.api';

const DAYS_TO_SHOW = 7;

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

interface ScheduleDayRowProps {
  entry: BackendScheduleDay;
  defaultExpanded?: boolean;
}

function ScheduleDayRow({ entry, defaultExpanded = false }: ScheduleDayRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-md border">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-accent/50 transition-colors"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="text-sm font-medium">{formatDayLabel(entry.date)}</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {entry.items.length} {entry.items.length === 1 ? 'item' : 'items'}
        </Badge>
      </button>

      {expanded && (
        <div className="border-t px-3 py-2 space-y-1.5">
          {entry.items.map((item: BackendSpacedRepetitionItem) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-1"
            >
              <span className="text-sm truncate min-w-0 flex-1">{item.learningItem.title}</span>
              {item.learningItem.category?.name && (
                <Badge variant="outline" className="ml-2 text-xs shrink-0">
                  {item.learningItem.category.name}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse h-10 rounded-md border bg-muted" />
      ))}
    </div>
  );
}

export function ReviewSchedule() {
  const { data, isLoading, isError } = useReviewSchedule();

  const visibleEntries = data
    ? data.filter((e) => e.items.length > 0).slice(0, DAYS_TO_SHOW)
    : [];

  const totalScheduled = data?.reduce((sum, e) => sum + e.items.length, 0) ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Upcoming Reviews</CardTitle>
        {totalScheduled > 0 && (
          <span className="text-xs text-muted-foreground">
            {totalScheduled} scheduled
          </span>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        {isLoading && <ScheduleSkeleton />}

        {isError && (
          <p className="text-sm text-destructive">
            Failed to load review schedule. Please try again.
          </p>
        )}

        {!isLoading && !isError && visibleEntries.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No reviews scheduled</p>
          </div>
        )}

        {!isLoading && !isError && visibleEntries.length > 0 && (
          <div className="space-y-2">
            {visibleEntries.map((entry, index) => (
              <ScheduleDayRow
                key={entry.date}
                entry={entry}
                defaultExpanded={index < 3}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
