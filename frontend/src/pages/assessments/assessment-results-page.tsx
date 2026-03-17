import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AssessmentResultPanel } from '@/components/assessments/assessment-result-panel';
import { AssessmentWizard } from '@/components/assessments/assessment-wizard';
import { useAssessmentResults } from '@/queries/use-assessments';

// Skeleton for loading state
function ResultsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Score card skeleton */}
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <div className="h-16 w-28 rounded-lg bg-muted" />
          <div className="h-5 w-20 rounded bg-muted" />
          <div className="h-3 w-44 rounded bg-muted" />
          <div className="h-3 w-full max-w-sm rounded-full bg-muted" />
        </CardContent>
      </Card>

      {/* Feedback cards skeleton */}
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="space-y-2 py-5">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-4/5 rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AssessmentResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data: results, isLoading, isError } = useAssessmentResults(id ?? '');

  return (
    <div className="space-y-6">
      {/* Header */}
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

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {results ? results.learningItemTitle : 'Assessment Results'}
        </h1>
        {results && (
          <p className="text-sm text-muted-foreground">
            Submitted{' '}
            {new Date(results.submittedAt).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </div>

      {/* Loading */}
      {isLoading && <ResultsSkeleton />}

      {/* Error */}
      {isError && (
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load results. The assessment may still be evaluating — please refresh in a
            moment.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/assessments')}>
              Back to Assessments
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <Loader2 className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {!isLoading && !isError && results && (
        <AssessmentResultPanel
          run={results}
          onNewAssessment={() => setWizardOpen(true)}
        />
      )}

      <AssessmentWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
