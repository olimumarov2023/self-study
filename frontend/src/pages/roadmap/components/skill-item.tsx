import { Lock, Circle, Clock, CheckCircle2, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { RoadmapSkill, SkillStatus } from '@/types/roadmap.types';

interface SkillItemProps {
  skill: RoadmapSkill
  onStatusChange: (id: string, status: SkillStatus) => void
  isPending?: boolean
}

const STATUS_CYCLE: Record<SkillStatus, SkillStatus> = {
  LOCKED: 'LOCKED',
  AVAILABLE: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  COMPLETED: 'AVAILABLE',
};

function StatusIcon({ status, isPending }: { status: SkillStatus; isPending: boolean }) {
  if (isPending) {
    return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />;
  }
  switch (status) {
    case 'LOCKED':
      return <Lock className="h-4 w-4 shrink-0 text-muted-foreground/50" />;
    case 'AVAILABLE':
      return <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />;
    case 'IN_PROGRESS':
      return <Clock className="h-4 w-4 shrink-0 text-blue-500" />;
    case 'COMPLETED':
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />;
  }
}

export function SkillItem({ skill, onStatusChange, isPending = false }: SkillItemProps) {
  const isLocked = skill.status === 'LOCKED';

  function handleClick() {
    if (isLocked || isPending) return;
    onStatusChange(skill.id, STATUS_CYCLE[skill.status]);
  }

  return (
    <div
      role={isLocked ? undefined : 'button'}
      tabIndex={isLocked ? undefined : 0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        isLocked
          ? 'cursor-default opacity-50'
          : 'cursor-pointer hover:bg-accent',
        isPending && 'pointer-events-none'
      )}
    >
      <StatusIcon status={skill.status} isPending={isPending} />

      <span
        className={cn(
          'flex-1',
          skill.status === 'COMPLETED' && 'line-through text-muted-foreground'
        )}
      >
        {skill.name}
      </span>

      {skill.category && (
        <Badge variant="secondary" className="text-xs font-normal">
          {skill.category.name}
        </Badge>
      )}
    </div>
  );
}
