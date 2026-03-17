import { Clock, BarChart3 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Priority, LearnStatus } from '@/types/enums';

import type { LearningItem } from '@/types/learning-item.types';

interface LearningItemCardProps {
  item: LearningItem;
  onClick: (item: LearningItem) => void;
}

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [Priority.HIGH]: 'destructive',
  [Priority.MEDIUM]: 'default',
  [Priority.LOW]: 'secondary',
};

const PRIORITY_LABEL: Record<string, string> = {
  [Priority.HIGH]: 'High',
  [Priority.MEDIUM]: 'Medium',
  [Priority.LOW]: 'Low',
};

const STATUS_LABEL: Record<string, string> = {
  [LearnStatus.TO_LEARN]: 'To Learn',
  [LearnStatus.PLANNED]: 'Planned',
  [LearnStatus.IN_PROGRESS]: 'In Progress',
  [LearnStatus.LEARNED]: 'Learned',
  [LearnStatus.NEEDS_REVISION]: 'Needs Revision',
  [LearnStatus.ARCHIVED]: 'Archived',
};

function getDifficultyLabel(difficulty: number): string {
  const labels = ['', 'Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
  return labels[difficulty] ?? `${difficulty}/5`;
}

export function LearningItemCard({ item, onClick }: LearningItemCardProps) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={() => onClick(item)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              {item.category && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.category.color ?? '#6b7280' }}
                  />
                  {item.category.name}
                </span>
              )}
              <Badge variant="outline" className="text-xs">
                {STATUS_LABEL[item.status] ?? item.status}
              </Badge>
            </div>

            <h3 className="font-medium leading-snug">{item.title}</h3>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={PRIORITY_VARIANT[item.priority] ?? 'secondary'}>
                {PRIORITY_LABEL[item.priority] ?? item.priority}
              </Badge>

              <Badge variant="outline" className="gap-1 text-xs">
                <BarChart3 className="h-3 w-3" />
                {getDifficultyLabel(item.difficulty)}
              </Badge>

              {item.estimatedHours != null && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {item.estimatedHours}h
                </span>
              )}
            </div>

            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
