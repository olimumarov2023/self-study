import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { AssessmentResultsResponse } from '@/types/assessment.types';

interface AssessmentResultPanelProps {
  run: AssessmentResultsResponse;
  onNewAssessment: () => void;
}

function getScoreColor(percentage: number): string {
  if (percentage >= 70) return 'text-green-600 dark:text-green-400';
  if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreProgressColor(percentage: number): string {
  if (percentage >= 70) return 'bg-green-500';
  if (percentage >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getScoreBadgeVariant(percentage: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (percentage >= 70) return 'default';
  if (percentage >= 50) return 'secondary';
  return 'destructive';
}

function getScoreLabel(percentage: number): string {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 70) return 'Good';
  if (percentage >= 50) return 'Needs Work';
  return 'Below Target';
}

export function AssessmentResultPanel({
  run,
  onNewAssessment,
}: AssessmentResultPanelProps) {
  const navigate = useNavigate();
  const pct = Math.round(run.percentage);

  return (
    <div className="space-y-6">
      {/* Score hero */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className={cn('text-7xl font-bold tabular-nums', getScoreColor(pct))}>
              {pct}
              <span className="text-3xl">%</span>
            </div>
            <Badge variant={getScoreBadgeVariant(pct)} className="text-sm px-3 py-0.5">
              {getScoreLabel(pct)}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {run.score} / {run.maxScore} points &middot;{' '}
              {run.mode.replace('_', ' ')} &middot; Difficulty {run.difficulty}/5
            </p>

            {/* Progress bar */}
            <div className="w-full max-w-sm">
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    getScoreProgressColor(pct),
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topic info */}
      <div className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{run.learningItemTitle}</span>
        {run.reviewScheduled && (
          <span>
            {' '}
            &middot; Next review in{' '}
            <span className="font-medium text-foreground">
              {run.reviewScheduled.intervalDays} day
              {run.reviewScheduled.intervalDays !== 1 ? 's' : ''}
            </span>
          </span>
        )}
      </div>

      {/* Summary */}
      {run.feedback.summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{run.feedback.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Strengths */}
      {run.feedback.strengths.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {run.feedback.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  {strength}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Gaps — derived from weakConcepts + per-question feedback */}
      {run.weakConcepts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Gaps to Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {run.weakConcepts.map((concept, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  {concept}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {run.feedback.revisionRecommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {run.feedback.revisionRecommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Per-question breakdown */}
      {run.feedback.perQuestion.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Question Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {run.feedback.perQuestion.map((qf, i) => (
                <li key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      {qf.correct ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                      )}
                      Q{qf.questionIndex + 1}
                      {qf.conceptTested && (
                        <span className="text-muted-foreground">— {qf.conceptTested}</span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {qf.pointsAwarded}/{qf.pointsPossible} pts
                    </span>
                  </div>
                  {qf.explanation && (
                    <p className="pl-5 text-xs text-muted-foreground">{qf.explanation}</p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => navigate('/backlog')}>
          Back to Backlog
        </Button>
        <Button onClick={onNewAssessment}>
          <Plus className="h-4 w-4" />
          New Assessment
        </Button>
      </div>
    </div>
  );
}
