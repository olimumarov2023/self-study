import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { StudyBookStatus } from '@/types/study-tracker.types';

const STATUS_LABELS: Record<StudyBookStatus, string> = {
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
};

const STATUS_CLASSES: Record<StudyBookStatus, string> = {
  IN_PROGRESS: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  COMPLETED: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
  ON_HOLD: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
};

interface BookStatusBadgeProps {
  status: StudyBookStatus;
  className?: string;
}

export function BookStatusBadge({ status, className }: BookStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_CLASSES[status], className)}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
