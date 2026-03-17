import { useNavigate } from 'react-router-dom';
import { BookOpen, Video, Pencil, Trash2, ExternalLink, PlayCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import type { LibraryResource, ResourceStatus, ResourceType } from '@/types/library.types';

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

function TypeBadge({ type }: { type: ResourceType }) {
  return (
    <Badge variant="outline" className="gap-1 text-xs">
      {type === 'BOOK' ? (
        <BookOpen className="h-3 w-3" />
      ) : (
        <Video className="h-3 w-3" />
      )}
      {type === 'BOOK' ? 'Book' : 'Video'}
    </Badge>
  );
}

interface ResourceCardProps {
  resource: LibraryResource;
  onEdit: () => void;
  onDelete: () => void;
}

export function ResourceCard({ resource, onEdit, onDelete }: ResourceCardProps) {
  const navigate = useNavigate();

  const progressPercent = resource.progressPercent ?? 0;
  const hasProgress = resource.status !== 'NOT_STARTED';

  function handleResume() {
    if (resource.type === 'VIDEO' && resource.url) {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    } else {
      navigate(`/library/${resource.id}`);
    }
  }

  const subtitle =
    resource.type === 'BOOK'
      ? resource.author
      : resource.url;

  return (
    <Card className="flex flex-col transition-colors hover:border-primary/30">
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        {/* Top row: badges + actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <TypeBadge type={resource.type} />
            <Badge variant={getStatusVariant(resource.status)} className="text-xs">
              {STATUS_LABELS[resource.status]}
            </Badge>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onEdit}
              aria-label="Edit resource"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDelete}
              aria-label="Delete resource"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Title + subtitle */}
        <div className="min-w-0">
          <p
            className="cursor-pointer truncate font-medium leading-snug hover:text-primary"
            onClick={() => navigate(`/library/${resource.id}`)}
          >
            {resource.title}
          </p>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {resource.type === 'VIDEO' ? (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  {resource.url}
                </a>
              ) : (
                subtitle
              )}
            </p>
          )}
        </div>

        {/* Progress */}
        {hasProgress && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        )}

        {/* Footer: sessions + resume */}
        <div className={cn('mt-auto flex items-center justify-between gap-2 pt-1')}>
          <span className="text-xs text-muted-foreground">
            {resource.sessionCount ?? 0} session{(resource.sessionCount ?? 0) !== 1 ? 's' : ''}
          </span>

          {resource.status !== 'COMPLETED' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handleResume}
            >
              {resource.type === 'VIDEO' ? (
                <PlayCircle className="h-3.5 w-3.5" />
              ) : (
                <BookOpen className="h-3.5 w-3.5" />
              )}
              {resource.resumePosition
                ? `Resume from ${resource.resumePosition}`
                : resource.status === 'NOT_STARTED'
                  ? 'Start'
                  : 'Continue'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
