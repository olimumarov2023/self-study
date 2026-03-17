import { Clock } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StudyHoursSummaryProps {
  studyMinutes: number;
}

export function StudyHoursSummary({ studyMinutes }: StudyHoursSummaryProps) {
  const hours = Math.floor(studyMinutes / 60);
  const minutes = studyMinutes % 60;
  const formatted = `${hours}:${minutes.toString().padStart(2, '0')}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Study Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold">{formatted}</p>
            <p className="text-sm text-muted-foreground">hours : minutes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
