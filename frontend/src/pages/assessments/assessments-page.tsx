import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, ClipboardList } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AssessmentWizard } from '@/components/assessments/assessment-wizard';
import { useAssessmentHistory } from '@/queries/use-assessments';
import { AssessmentStatus } from '@/types/enums';
import { cn } from '@/lib/utils';

import type { AssessmentSummary } from '@/types/assessment.types';
import type { AssessmentMode as AssessmentModeType, AssessmentStatus as AssessmentStatusType } from '@/types/enums';

const MODE_LABELS: Record<AssessmentModeType, string> = {
  QUIZ: 'Quiz',
  QA: 'Q&A',
  TASK: 'Task',
  FLASHCARD: 'Flashcard',
  TEACH_BACK: 'Teach Back',
  BUG_ANALYSIS: 'Bug Analysis',
};

const STATUS_LABELS: Record<AssessmentStatusType, string> = {
  GENERATING: 'Generating',
  READY: 'Ready',
  SUBMITTED: 'Submitted',
  EVALUATED: 'Evaluated',
  FAILED: 'Failed',
};

function getStatusVariant(
  status: AssessmentStatusType,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === AssessmentStatus.EVALUATED) return 'default';
  if (status === AssessmentStatus.FAILED) return 'destructive';
  if (status === AssessmentStatus.SUBMITTED) return 'secondary';
  return 'outline';
}

function getScoreColor(pct: number): string {
  if (pct >= 70) return 'text-green-600 dark:text-green-400';
  if (pct >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function AssessmentListItem({ summary }: { summary: AssessmentSummary }) {
  const navigate = useNavigate();

  const hasScore =
    summary.score !== null &&
    summary.maxScore !== null &&
    summary.maxScore > 0;
  const pct = hasScore
    ? Math.round(((summary.score as number) / (summary.maxScore as number)) * 100)
    : null;

  function handleClick() {
    if (summary.status === AssessmentStatus.EVALUATED) {
      navigate(`/assessments/${summary.id}/results`);
    } else if (summary.status === AssessmentStatus.READY) {
      navigate(`/assessments/${summary.id}/run`);
    }
  }

  const isClickable =
    summary.status === AssessmentStatus.EVALUATED ||
    summary.status === AssessmentStatus.READY;

  return (
    <Card
      className={cn(
        'transition-colors',
        isClickable && 'cursor-pointer hover:border-primary/40 hover:bg-accent/30',
      )}
      onClick={isClickable ? handleClick : undefined}
    >
      <CardContent className="flex items-center justify-between gap-4 py-4 px-5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{summary.learningItemTitle}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDate(summary.createdAt)} &middot; {summary.questionCount} questions &middot; Difficulty{' '}
            {summary.difficulty}/5
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {MODE_LABELS[summary.mode]}
          </Badge>
          <Badge variant={getStatusVariant(summary.status)}>
            {STATUS_LABELS[summary.status]}
          </Badge>
          {pct !== null && (
            <span className={cn('text-sm font-semibold tabular-nums', getScoreColor(pct))}>
              {pct}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AssessmentsPage() {
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data, isLoading, isError } = useAssessmentHistory({
    limit: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const assessments = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
          <p className="text-muted-foreground">
            AI-generated assessments to test your knowledge.
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)}>
          <Plus className="h-4 w-4" />
          New Assessment
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load assessment history. Please try again.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && assessments.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground/50" />
          <div>
            <p className="font-medium">No assessments yet</p>
            <p className="text-sm text-muted-foreground">
              Start your first one to test your knowledge.
            </p>
          </div>
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4" />
            New Assessment
          </Button>
        </div>
      )}

      {/* List */}
      {!isLoading && !isError && assessments.length > 0 && (
        <div className="space-y-2">
          {assessments.map((summary) => (
            <AssessmentListItem key={summary.id} summary={summary} />
          ))}
          <p className="pt-1 text-xs text-muted-foreground">
            Showing {assessments.length} of {data?.meta.total ?? assessments.length} assessments
          </p>
        </div>
      )}

      <AssessmentWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
