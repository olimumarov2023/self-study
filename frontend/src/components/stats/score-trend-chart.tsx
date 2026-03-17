import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useScoreTrend } from '@/queries/use-stats';

import type { ScoreTrendPoint } from '@/types/stats.types';
import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

const PASSING_THRESHOLD = 70;
const ALL_ITEMS_VALUE = '__all__';

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------
function ChartSkeleton() {
  return (
    <div className="h-64 w-full animate-pulse rounded-md bg-muted" />
  );
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------
function ScoreTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload as ChartPoint | undefined;
  if (!point) return null;

  return (
    <div
      className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
    >
      <p className="font-medium">{point.title}</p>
      <p className="text-muted-foreground">{point.date}</p>
      <p className="text-muted-foreground capitalize">{point.mode}</p>
      <p className="mt-1 font-semibold">Score: {point.score}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal chart data shape
// ---------------------------------------------------------------------------
interface ChartPoint {
  date: string;
  score: number;
  title: string;
  mode: string;
  learningItemId: string;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ScoreTrendChart() {
  const [selectedItemId, setSelectedItemId] = useState<string>(ALL_ITEMS_VALUE);

  // Always fetch everything; filtering is done client-side so we keep the
  // full dataset available for the item dropdown.
  const { data, isLoading, isError } = useScoreTrend();

  // Derive unique learning items from the full dataset for the filter dropdown.
  const learningItems = useMemo<Array<{ id: string; title: string }>>(() => {
    if (!data) return [];
    const seen = new Map<string, string>();
    data.forEach((p: ScoreTrendPoint) => {
      if (!seen.has(p.learningItemId)) {
        seen.set(p.learningItemId, p.learningItemTitle);
      }
    });
    return Array.from(seen.entries()).map(([id, title]) => ({ id, title }));
  }, [data]);

  // Apply filter and shape into chart points.
  const chartData = useMemo<ChartPoint[]>(() => {
    if (!data) return [];

    const filtered =
      selectedItemId === ALL_ITEMS_VALUE
        ? data
        : data.filter((p: ScoreTrendPoint) => p.learningItemId === selectedItemId);

    return filtered
      .slice()
      .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
      .map((p: ScoreTrendPoint) => ({
        date: new Date(p.completedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        score: p.score,
        title: p.learningItemTitle,
        mode: p.mode,
        learningItemId: p.learningItemId,
      }));
  }, [data, selectedItemId]);

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '6px',
    color: 'hsl(var(--popover-foreground))',
  };

  // ------ Render states ------

  const header = (
    <CardHeader className="pb-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-sm font-medium">Score Trend</CardTitle>
        {!isLoading && !isError && learningItems.length > 0 && (
          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
            <SelectTrigger className="h-8 w-full text-xs sm:w-52">
              <SelectValue placeholder="All items" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ITEMS_VALUE}>All items</SelectItem>
              {learningItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </CardHeader>
  );

  if (isLoading) {
    return (
      <Card>
        {header}
        <CardContent>
          <ChartSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        {header}
        <CardContent>
          <p className="py-8 text-center text-sm text-destructive">
            Failed to load score trend. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <Card>
        {header}
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            Complete assessments to see your score trend.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {header}
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                label={{ value: 'Score', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<ScoreTooltip />} contentStyle={tooltipStyle} />
              <ReferenceLine
                y={PASSING_THRESHOLD}
                stroke="hsl(var(--destructive))"
                strokeDasharray="5 3"
                label={{ value: `Pass (${PASSING_THRESHOLD})`, fontSize: 11, fill: 'hsl(var(--destructive))', position: 'insideTopRight' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                activeDot={{ r: 6 }}
                name="Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
