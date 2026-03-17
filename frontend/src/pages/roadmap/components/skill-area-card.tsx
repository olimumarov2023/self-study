import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { SkillItem } from './skill-item';

import type { RoadmapArea, SkillStatus } from '@/types/roadmap.types';

interface SkillAreaCardProps {
  area: RoadmapArea
  pendingSkillId?: string
  onStatusChange: (id: string, status: SkillStatus) => void
}

export function SkillAreaCard({ area, pendingSkillId, onStatusChange }: SkillAreaCardProps) {
  const completed = area.skills.filter((s) => s.status === 'COMPLETED').length;
  const total = area.skills.length;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">
            {area.icon && (
              <span className="mr-2" aria-hidden="true">
                {area.icon}
              </span>
            )}
            {area.name}
          </CardTitle>
          <Badge variant={completed === total && total > 0 ? 'default' : 'secondary'}>
            {completed}/{total} complete
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 pb-2">
        {area.skills.length === 0 ? (
          <p className="px-6 py-2 text-sm text-muted-foreground">No skills defined yet.</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {area.skills
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((skill) => (
                <li key={skill.id}>
                  <SkillItem
                    skill={skill}
                    onStatusChange={onStatusChange}
                    isPending={pendingSkillId === skill.id}
                  />
                </li>
              ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
