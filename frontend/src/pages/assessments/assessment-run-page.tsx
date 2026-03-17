import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AssessmentPlayer } from '@/components/assessments/assessment-player';
import { useAssessment, useSubmitAssessment } from '@/queries/use-assessments';
import { AssessmentStatus } from '@/types/enums';

import type { AssessmentAnswers } from '@/types/assessment.types';

const MODE_LABELS: Record<string, string> = {
  QUIZ: 'Quiz',
  QA: 'Q&A',
  TASK: 'Task',
  FLASHCARD: 'Flashcard',
  TEACH_BACK: 'Teach Back',
  BUG_ANALYSIS: 'Bug Analysis',
};

export function AssessmentRunPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: assessment, isLoading, isError, refetch } = useAssessment(id ?? '');
  const submitMutation = useSubmitAssessment();

  // Redirect if the assessment is already evaluated or no longer in a runnable state
  useEffect(() => {
    if (!assessment) return;

    if (
      assessment.status === AssessmentStatus.EVALUATED ||
      assessment.status === AssessmentStatus.SUBMITTED
    ) {
      navigate(`/assessments/${id}/results`, { replace: true });
    }
  }, [assessment, id, navigate]);

  // Poll while the assessment is still generating
  useEffect(() => {
    if (assessment?.status !== AssessmentStatus.GENERATING) return;

    const timer = setInterval(() => {
      void refetch();
    }, 3000);

    return () => clearInterval(timer);
  }, [assessment?.status, refetch]);

  function handleSubmit(answers: AssessmentAnswers) {
    if (!id) return;

    submitMutation.mutate(
      { id, payload: { answers } },
      {
        onSuccess: () => {
          navigate(`/assessments/${id}/results`);
        },
      },
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !assessment) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load assessment. It may no longer exist.
        </div>
        <Button variant="outline" onClick={() => navigate('/assessments')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Assessments
        </Button>
      </div>
    );
  }

  if (assessment.status === AssessmentStatus.GENERATING) {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium">Generating your assessment...</p>
        <p className="text-xs text-muted-foreground">This usually takes a few seconds.</p>
      </div>
    );
  }

  if (assessment.status === AssessmentStatus.FAILED) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">Assessment generation failed</p>
          {assessment.errorMessage && (
            <p className="mt-1 text-xs text-destructive/80">{assessment.errorMessage}</p>
          )}
        </div>
        <Button variant="outline" onClick={() => navigate('/assessments')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Assessments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2"
              onClick={() => navigate('/assessments')}
            >
              <ArrowLeft className="h-4 w-4" />
              Assessments
            </Button>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {assessment.learningItemTitle}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{MODE_LABELS[assessment.mode] ?? assessment.mode}</Badge>
            <Badge variant="outline">{assessment.questionCount} questions</Badge>
            <Badge variant="outline">Difficulty {assessment.difficulty}/5</Badge>
          </div>
        </div>
      </div>

      {/* Error from submit */}
      {submitMutation.isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          Failed to submit assessment. Please try again.
        </div>
      )}

      {/* Player */}
      <AssessmentPlayer
        assessment={assessment}
        onSubmit={handleSubmit}
        isSubmitting={submitMutation.isPending}
      />
    </div>
  );
}
