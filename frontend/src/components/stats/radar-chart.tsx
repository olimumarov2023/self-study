import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRadar } from '@/queries/use-stats';

export function RadarChart() {
  const { data, isLoading, isError } = useRadar();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load radar data.</p>
        </CardContent>
      </Card>
    );
  }

  const isEmpty = !data || data.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Balance</CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-[280px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Add learning items to see category balance
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <RechartsRadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis tick={{ fontSize: 10 }} axisLine={false} />
              <Radar
                name="Actual"
                dataKey="actual"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.35}
              />
              <Radar
                name="Target"
                dataKey="target"
                stroke="#f97316"
                fill="none"
                strokeDasharray="5 3"
                strokeWidth={2}
                fillOpacity={0}
              />
              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />
            </RechartsRadarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
