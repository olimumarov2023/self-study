import { Clock, Flame } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import type { DashboardStats } from '@/hooks/use-dashboard';

interface DailyProgressProps {
  stats: DashboardStats;
}

export function DailyProgress({ stats }: DailyProgressProps) {
  const hours = Math.floor(stats.studyMinutes / 60);
  const minutes = stats.studyMinutes % 60;
  const timeFormatted = `${hours}:${minutes.toString().padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      {/* Completion progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{stats.completedItems}</span>
            <span className="text-muted-foreground">of {stats.totalItems} items completed</span>
          </div>

          <Progress value={stats.progressPercent} className="h-2" />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{stats.progressPercent}% done</span>
            {stats.inProgressItems > 0 && (
              <span>{stats.inProgressItems} in progress</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats summary row */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{timeFormatted}</p>
              <p className="text-xs text-muted-foreground">study time</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{stats.streak}</p>
              <p className="text-xs text-muted-foreground">
                day{stats.streak !== 1 ? 's' : ''} streak
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
