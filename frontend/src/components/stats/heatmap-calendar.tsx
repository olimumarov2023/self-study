import { useMemo } from 'react';
import { ActivityCalendar } from 'react-activity-calendar';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useHeatmap } from '@/queries/use-stats';

import type { HeatmapDay } from '@/types/stats.types';
import type { Activity } from 'react-activity-calendar';

function countToLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function buildActivityData(days: HeatmapDay[], year: number): Activity[] {
  // ActivityCalendar requires the first and last entries to define the range.
  const start: Activity = { date: `${year}-01-01`, count: 0, level: 0 };
  const end: Activity = { date: `${year}-12-31`, count: 0, level: 0 };

  const mapped: Activity[] = days.map((d) => ({
    date: d.date,
    count: d.count,
    level: countToLevel(d.count),
  }));

  // Merge range sentinels with real data (dedup by date, real data wins).
  const byDate = new Map<string, Activity>();
  byDate.set(start.date, start);
  for (const a of mapped) {
    byDate.set(a.date, a);
  }
  byDate.set(end.date, byDate.get(end.date) ?? end);

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

interface HeatmapCalendarProps {
  year?: number;
}

export function HeatmapCalendar({ year }: HeatmapCalendarProps) {
  const currentYear = new Date().getFullYear();
  const targetYear = year ?? currentYear;

  const { data, isLoading, isError } = useHeatmap(year);

  const activityData = useMemo(() => {
    if (!data) return [];
    return buildActivityData(data, targetYear);
  }, [data, targetYear]);

  // Build a lookup for tooltip: date -> minutes
  const minutesByDate = useMemo(() => {
    if (!data) return new Map<string, number>();
    return new Map(data.map((d) => [d.date, d.minutes]));
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[128px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load activity data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity — {targetYear}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <ActivityCalendar
          data={activityData}
          loading={isLoading}
          blockSize={13}
          blockMargin={4}
          fontSize={12}
          showWeekdayLabels
          theme={{
            light: ['#f0fdf4', '#bbf7d0', '#4ade80', '#16a34a', '#14532d'],
            dark:  ['#1a2e1a', '#166534', '#16a34a', '#4ade80', '#86efac'],
          }}
          labels={{
            totalCount: '{{count}} sessions in {{year}}',
          }}
          tooltips={{
            activity: {
              text: (activity: Activity) => {
                const mins = minutesByDate.get(activity.date) ?? 0;
                return `${activity.date}: ${activity.count} session${activity.count !== 1 ? 's' : ''}, ${mins} min`;
              },
            },
          }}
        />
      </CardContent>
    </Card>
  );
}
