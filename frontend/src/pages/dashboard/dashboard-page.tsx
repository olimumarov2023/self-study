import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { DailyProgress } from '@/components/dashboard/daily-progress';
import { TodayItemsList } from '@/components/dashboard/today-items-list';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentSessions } from '@/components/timer/recent-sessions';
import { QuickAddModal } from '@/components/learning-items/quick-add-modal';
import { useCreateLearningItem } from '@/queries/use-learning-items';
import { useStartSession } from '@/queries/use-time-tracking';
import { useTimerStore } from '@/stores/timer.store';
import { useDashboard } from '@/hooks/use-dashboard';

export function DashboardPage() {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const { allItems, stats, isLoading, isError } = useDashboard();
  const createItem = useCreateLearningItem();
  const startSession = useStartSession();
  const isTimerActive = useTimerStore((s) => !!s.activeSessionId);

  const handleStartTimer = () => {
    if (!isTimerActive) {
      startSession.mutate({});
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          What should you learn today?
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load dashboard data. Please try again.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-4">
          {/* Progress section */}
          <DailyProgress stats={stats} />

          {/* Today's items */}
          <TodayItemsList items={allItems} />

          {/* Quick actions */}
          <QuickActions
            onAddTopic={() => setQuickAddOpen(true)}
            onStartTimer={handleStartTimer}
            isTimerActive={isTimerActive}
          />

          {/* Recent study sessions */}
          <RecentSessions />
        </div>
      )}

      <QuickAddModal
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onSubmit={(data) => {
          createItem.mutate(data, {
            onSuccess: () => setQuickAddOpen(false),
          });
        }}
        isPending={createItem.isPending}
      />
    </div>
  );
}
