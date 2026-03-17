import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Video,
  Pencil,
  Trash2,
  PlayCircle,
  Loader2,
  PlusCircle,
  CalendarDays,
  Clock,
  FileText,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  useLibraryResource,
  useLibrarySessions,
  useDeleteResource,
} from '@/queries/use-library';
import { ResourceForm } from './components/resource-form';
import { SessionForm } from './components/session-form';

import type { ResourceStatus, ResourceType, ResourceSession } from '@/types/library.types';

const STATUS_LABELS: Record<ResourceStatus, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
};

function getStatusVariant(
  status: ResourceStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'COMPLETED') return 'default';
  if (status === 'IN_PROGRESS') return 'secondary';
  if (status === 'ON_HOLD') return 'destructive';
  return 'outline';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function SessionRow({ session, type }: { session: ResourceSession; type: ResourceType }) {
  const isBook = type === 'BOOK';

  const rangeLabel = isBook
    ? session.startPage != null && session.endPage != null
      ? `Pages ${session.startPage}–${session.endPage}`
      : session.endPage != null
        ? `Up to page ${session.endPage}`
        : null
    : session.startMinute != null && session.endMinute != null
      ? `${session.startMinute}–${session.endMinute} min`
      : session.endMinute != null
        ? `Up to ${session.endMinute} min`
        : null;

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {rangeLabel && <span>{rangeLabel}</span>}
          {session.durationMin > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {session.durationMin} min
            </span>
          )}
        </div>
        {session.notes && (
          <p className="truncate text-xs text-muted-foreground">{session.notes}</p>
        )}
      </div>
      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
        <CalendarDays className="h-3 w-3" />
        {formatDate(session.sessionDate)}
      </span>
    </div>
  );
}

// Skeleton for loading state
function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-64 rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-5 w-full max-w-md rounded bg-muted" />
        <div className="h-3 w-32 rounded bg-muted" />
      </div>
      <div className="h-2 w-full rounded-full bg-muted" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 w-full rounded bg-muted" />
      ))}
    </div>
  );
}

export function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);

  const { data: resource, isLoading, isError } = useLibraryResource(id ?? '');
  const { data: sessions, isLoading: sessionsLoading } = useLibrarySessions(id ?? '');
  const deleteResource = useDeleteResource();

  function handleDelete() {
    if (!resource) return;
    if (window.confirm(`Delete "${resource.title}"? This cannot be undone.`)) {
      deleteResource.mutate(resource.id, {
        onSuccess: () => navigate('/library'),
      });
    }
  }

  function handleResume() {
    if (!resource) return;
    if (resource.type === 'VIDEO' && resource.url) {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => navigate('/library')}
        >
          <ArrowLeft className="h-4 w-4" />
          Library
        </Button>
      </div>

      {/* Loading skeleton */}
      {isLoading && <DetailSkeleton />}

      {/* Error */}
      {isError && (
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load resource. Please go back and try again.
          </div>
          <Button variant="outline" onClick={() => navigate('/library')}>
            Back to Library
          </Button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !isError && resource && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {resource.type === 'BOOK' ? (
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Video className="h-5 w-5 text-muted-foreground" />
                )}
                <h1 className="text-2xl font-bold tracking-tight">{resource.title}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={getStatusVariant(resource.status)} className="text-xs">
                  {STATUS_LABELS[resource.status]}
                </Badge>
                {resource.author && (
                  <span className="text-sm text-muted-foreground">by {resource.author}</span>
                )}
                {resource.type === 'VIDEO' && resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Open video
                  </a>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={deleteResource.isPending}
              >
                {deleteResource.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </Button>
            </div>
          </div>

          {/* Progress card */}
          <Card>
            <CardContent className="space-y-4 pt-5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium tabular-nums">
                      {Math.round(resource.progressPercent ?? 0)}%
                    </span>
                  </div>
                  <Progress value={resource.progressPercent ?? 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {resource.type === 'BOOK'
                      ? `Page ${resource.currentPage ?? 0} of ${resource.totalPages ?? '?'}`
                      : `${resource.watchedMinutes ?? 0} / ${resource.totalMinutes ?? '?'} minutes`}
                  </p>
                </div>

                {resource.status !== 'COMPLETED' && (
                  <div className="flex gap-2 shrink-0">
                    {resource.type === 'VIDEO' && resource.url && (
                      <Button variant="outline" onClick={handleResume}>
                        <PlayCircle className="h-4 w-4" />
                        {resource.resumePosition
                          ? `Resume at ${resource.resumePosition}`
                          : 'Open Video'}
                      </Button>
                    )}
                    <Button onClick={() => setSessionOpen(true)}>
                      <PlusCircle className="h-4 w-4" />
                      Log Session
                    </Button>
                  </div>
                )}

                {resource.status === 'COMPLETED' && (
                  <Badge variant="default" className="shrink-0">Completed</Badge>
                )}
              </div>

              {resource.notes && (
                <>
                  <Separator />
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="whitespace-pre-wrap">{resource.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Session history */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Session History</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSessionOpen(true)}
                disabled={resource.status === 'COMPLETED'}
              >
                <PlusCircle className="h-4 w-4" />
                Log Session
              </Button>
            </CardHeader>
            <CardContent>
              {sessionsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!sessionsLoading && (sessions?.length ?? 0) === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No sessions logged yet. Hit "Log Session" after each study block.
                  </p>
                </div>
              )}

              {!sessionsLoading && (sessions?.length ?? 0) > 0 && (
                <div className="divide-y">
                  {sessions!.map((session) => (
                    <SessionRow key={session.id} session={session} type={resource.type} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit dialog */}
      {resource && (
        <ResourceForm
          open={editOpen}
          onOpenChange={setEditOpen}
          resource={resource}
        />
      )}

      {/* Session log dialog */}
      {resource && (
        <SessionForm
          open={sessionOpen}
          onOpenChange={setSessionOpen}
          resource={resource}
        />
      )}
    </div>
  );
}
