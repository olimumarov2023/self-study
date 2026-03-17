import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDueItems } from '@/queries/use-spaced-repetition';

function DueItemSkeleton() {
  return (
    <div className="animate-pulse flex items-center justify-between rounded-md border px-3 py-3">
      <div className="space-y-1.5 flex-1">
        <div className="h-4 w-48 rounded bg-muted" />
        <div className="h-3 w-24 rounded bg-muted" />
      </div>
      <div className="h-8 w-24 rounded bg-muted ml-3" />
    </div>
  );
}

function getDaysOverdue(nextReviewAt: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(nextReviewAt);
  due.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
}

export function DueList() {
  const navigate = useNavigate();
  const { data: items, isLoading, isError } = useDueItems();

  const overdueCount = items?.filter((i) => getDaysOverdue(i.nextReviewAt.toString()) > 0).length ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Due for Review</CardTitle>
        {items && items.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            {items.length} due
            {overdueCount > 0 && ` · ${overdueCount} overdue`}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        {isLoading && (
          <>
            <DueItemSkeleton />
            <DueItemSkeleton />
            <DueItemSkeleton />
          </>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            Failed to load due reviews. Please try again.
          </p>
        )}

        {!isLoading && !isError && items && items.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No reviews due today</p>
          </div>
        )}

        {!isLoading && !isError && items && items.length > 0 && (
          <div className="space-y-2">
            {items.map((item) => {
              const daysOverdue = getDaysOverdue(item.nextReviewAt.toString());
              return (
                <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium">{item.learningItem.title}</p>
                    <div className="flex items-center gap-2">
                      {item.learningItem.category?.name && (
                        <Badge variant="secondary" className="text-xs">
                          {item.learningItem.category.name}
                        </Badge>
                      )}
                      {daysOverdue > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          {daysOverdue}d overdue
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Due today</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="ml-3 shrink-0"
                    onClick={() => navigate(`/assessments?item=${item.learningItemId}`)}
                  >
                    <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                    Review Now
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
