import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useForecast } from '@/queries/use-stats';

function formatEstimatedDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function CompletionForecast() {
  const { data, isLoading, isError } = useForecast();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Completion Forecast</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-20 rounded-md" />
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Completion Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load forecast data.</p>
        </CardContent>
      </Card>
    );
  }

  const noActivity =
    !data ||
    (data.completedItems === 0 && data.avgCompletionPerWeek === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Completion Forecast</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {noActivity ? (
          <p className="text-sm text-muted-foreground">
            Complete some items to see your forecast
          </p>
        ) : (
          <>
            {/* Large completion percentage */}
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold tabular-nums">
                {Math.round(data.completionPercentage)}%
              </span>
              <span className="text-sm text-muted-foreground">
                completed
              </span>
            </div>

            {/* Progress bar */}
            <Progress value={data.completionPercentage} className="h-2.5" />

            {/* Item counts */}
            <p className="text-sm text-muted-foreground">
              {data.completedItems} of {data.totalItems} items done
            </p>

            {/* Pace-based estimate */}
            {data.estimatedWeeksRemaining !== null &&
              data.estimatedCompletionDate !== null ? (
              <p className="text-sm text-muted-foreground">
                At current pace: ~{data.estimatedWeeksRemaining} week
                {data.estimatedWeeksRemaining !== 1 ? 's' : ''} remaining &middot;{' '}
                Est. completion{' '}
                <span className="font-medium text-foreground">
                  {formatEstimatedDate(data.estimatedCompletionDate)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Keep studying to unlock a completion estimate
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
