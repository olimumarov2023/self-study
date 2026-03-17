import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import type { RoadmapProgress } from '@/types/roadmap.types';

interface RoadmapProgressBarProps {
  progress: RoadmapProgress
}

function motivationalText(percentage: number): string {
  if (percentage < 25) return 'Keep going!';
  if (percentage < 50) return 'Good progress!';
  if (percentage < 75) return 'More than halfway!';
  return 'Almost there!';
}

export function RoadmapProgressBar({ progress }: RoadmapProgressBarProps) {
  const { totalSkills, completed, percentage } = progress;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <div>
            <span className="text-2xl font-bold">{completed}</span>
            <span className="text-muted-foreground">
              {' '}/ {totalSkills} skills complete
            </span>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {motivationalText(percentage)}
          </span>
        </div>

        <Progress value={percentage} className="h-3" />

        <p className="mt-2 text-right text-xs text-muted-foreground">
          {Math.round(percentage)}%
        </p>
      </CardContent>
    </Card>
  );
}
