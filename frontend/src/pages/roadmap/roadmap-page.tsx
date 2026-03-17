import { useState } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

import { useRoadmap, useRoadmapProgress, useUpdateSkillStatus } from '@/queries/use-roadmap';
import { RoadmapProgressBar } from './components/roadmap-progress-bar';
import { SkillAreaCard } from './components/skill-area-card';

import type { SkillStatus } from '@/types/roadmap.types';

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

export function RoadmapPage() {
  const { data: areas, isLoading: areasLoading, isError: areasError } = useRoadmap();
  const { data: progress, isLoading: progressLoading } = useRoadmapProgress();
  const updateSkillStatus = useUpdateSkillStatus();

  const [pendingSkillId, setPendingSkillId] = useState<string | null>(null);

  function handleStatusChange(id: string, status: SkillStatus) {
    setPendingSkillId(id);
    updateSkillStatus.mutate(
      { id, status },
      { onSettled: () => setPendingSkillId(null) }
    );
  }

  const isLoading = areasLoading || progressLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Roadmap</h1>
        <p className="text-muted-foreground">
          Track your skill progression. Click a skill to update its status.
        </p>
      </div>

      {isLoading && (
        <>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-baseline justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </>
      )}

      {areasError && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load roadmap</AlertTitle>
          <AlertDescription>
            Could not fetch the roadmap data. Please refresh and try again.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !areasError && (
        <>
          {progress && <RoadmapProgressBar progress={progress} />}

          {areas && areas.length === 0 && (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <p className="text-muted-foreground">
                No skill areas defined yet. Check back soon!
              </p>
            </div>
          )}

          {areas && areas.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {areas
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((area) => (
                  <SkillAreaCard
                    key={area.id}
                    area={area}
                    pendingSkillId={pendingSkillId ?? undefined}
                    onStatusChange={handleStatusChange}
                  />
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
