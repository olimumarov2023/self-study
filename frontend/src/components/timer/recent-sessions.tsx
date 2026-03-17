import { useState } from 'react';
import { Clock, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimerDisplay } from '@/components/timer/timer-display';
import { ManualEntryForm } from '@/components/timer/manual-entry-form';
import { useSessions } from '@/queries/use-time-tracking';

import type { StudySession } from '@/types/time-tracking.types';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDurationSeconds(session: StudySession): number {
  if (session.durationMin != null) {
    return session.durationMin * 60;
  }
  if (session.endedAt) {
    return Math.floor(
      (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000,
    );
  }
  return 0;
}

export function RecentSessions() {
  const [manualOpen, setManualOpen] = useState(false);
  const { data: sessions, isLoading } = useSessions();

  // Show up to 10 most recent completed sessions
  const recentSessions = (sessions ?? [])
    .filter((s) => s.endedAt != null)
    .slice(0, 10);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Recent Study Sessions</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setManualOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Manual
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading sessions...</p>
          )}

          {!isLoading && recentSessions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No study sessions yet. Start the timer or add a manual entry.
            </p>
          )}

          {!isLoading && recentSessions.length > 0 && (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {session.learningItem?.title ?? 'General'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(session.startedAt)}
                      {session.note && (
                        <span className="ml-2 italic">— {session.note}</span>
                      )}
                    </p>
                  </div>
                  <div className="ml-3 flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <TimerDisplay seconds={getDurationSeconds(session)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ManualEntryForm open={manualOpen} onOpenChange={setManualOpen} />
    </>
  );
}
