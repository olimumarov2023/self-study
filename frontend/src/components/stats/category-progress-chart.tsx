import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
} from 'recharts';
import { AlertTriangle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCategoryProgress } from '@/queries/use-stats';

import type { CategoryProgress } from '@/types/stats.types';

// ---------------------------------------------------------------------------
// Custom X-axis tick — renders category name with an optional warning icon
// ---------------------------------------------------------------------------
interface CustomTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
  imbalanceSet: Set<string>;
}

function CategoryTick({ x = 0, y = 0, payload, imbalanceSet }: CustomTickProps) {
  const name = payload?.value ?? '';
  const hasFlag = imbalanceSet.has(name);

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="middle"
        fontSize={12}
        fill="hsl(var(--muted-foreground))"
      >
        {name}
      </text>
      {hasFlag && (
        <text
          x={0}
          y={0}
          dy={-2}
          textAnchor="middle"
          fontSize={11}
          fill="hsl(var(--destructive))"
        >
          ⚠
        </text>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------
function ChartSkeleton() {
  return (
    <div className="h-64 w-full animate-pulse rounded-md bg-muted" />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function CategoryProgressChart() {
  const { data, isLoading, isError } = useCategoryProgress();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Category Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Category Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-destructive">
            Failed to load category data. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Category Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No category data yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Build the set of category names that have an imbalance flag so the
  // custom tick can look them up in O(1).
  const imbalanceSet = new Set<string>(
    data.filter((c: CategoryProgress) => c.imbalanceFlag).map((c: CategoryProgress) => c.categoryName),
  );

  const chartData = data.map((c: CategoryProgress) => ({
    name: c.categoryName,
    'Total Items': c.itemCount,
    Completed: c.completedCount,
    'Avg Score': c.averageScore ?? 0,
  }));

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '6px',
    color: 'hsl(var(--popover-foreground))',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">Category Progress</CardTitle>
          {imbalanceSet.size > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <AlertTriangle className="h-3.5 w-3.5" />
              {imbalanceSet.size === 1 ? '1 category needs attention' : `${imbalanceSet.size} categories need attention`}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} barCategoryGap="20%" margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                tick={(props: any) => <CategoryTick {...props} imbalanceSet={imbalanceSet} />}
                interval={0}
                height={48}
              />
              {/* Left Y axis — item counts */}
              <YAxis
                yAxisId="items"
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                label={{ value: 'Items', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              {/* Right Y axis — score (0-100) */}
              <YAxis
                yAxisId="score"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                label={{ value: 'Score', angle: 90, position: 'insideRight', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                yAxisId="items"
                dataKey="Total Items"
                fill="hsl(var(--muted-foreground))"
                radius={[4, 4, 0, 0]}
                opacity={0.5}
              />
              <Bar
                yAxisId="items"
                dataKey="Completed"
                fill="hsl(142 71% 45%)"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="score"
                type="monotone"
                dataKey="Avg Score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
