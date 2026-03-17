import { useState } from 'react';
import { Calendar, Clock, Zap, Loader2, BellOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useReminders, useMarkRead, useGenerateDaily } from '@/queries/use-reminders';
import { timeAgo, dateGroupLabel } from '@/lib/time-ago';
import type { Reminder, ReminderType } from '@/types/reminder.types';

// ---- icon map per reminder type ----
const typeIcon: Record<ReminderType, React.ElementType> = {
  DAILY_SUMMARY: Calendar,
  SPACED_REP_DUE: Clock,
  STREAK_ALERT: Zap,
};

const typeLabel: Record<ReminderType, string> = {
  DAILY_SUMMARY: 'Daily summary',
  SPACED_REP_DUE: 'Spaced repetition due',
  STREAK_ALERT: 'Streak alert',
};

// ---- group helpers ----
function groupByDate(items: Reminder[]): Array<{ label: string; items: Reminder[] }> {
  const map = new Map<string, Reminder[]>();
  for (const item of items) {
    const label = dateGroupLabel(item.createdAt);
    const existing = map.get(label);
    if (existing) {
      existing.push(item);
    } else {
      map.set(label, [item]);
    }
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

// ---- single reminder row ----
function ReminderItem({
  reminder,
  onMarkRead,
}: {
  reminder: Reminder;
  onMarkRead: (id: string) => void;
}) {
  const Icon = typeIcon[reminder.type];

  return (
    <button
      type="button"
      onClick={() => !reminder.read && onMarkRead(reminder.id)}
      className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent"
    >
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          reminder.read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
        }`}
        aria-label={typeLabel[reminder.type]}
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`truncate text-sm ${
              reminder.read ? 'font-normal text-muted-foreground' : 'font-medium'
            }`}
          >
            {reminder.title}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {timeAgo(reminder.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{reminder.body}</p>
      </div>

      {/* Unread dot */}
      {!reminder.read && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
      )}
    </button>
  );
}

// ---- page ----
export function RemindersPage() {
  const [tab, setTab] = useState<'all' | 'unread'>('all');

  const unreadOnly = tab === 'unread';
  const { data: reminders, isLoading, isError, error } = useReminders(unreadOnly);
  const markRead = useMarkRead();
  const generateDaily = useGenerateDaily();

  const groups = groupByDate(reminders ?? []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reminders</h1>
          <p className="text-sm text-muted-foreground">
            Stay on track with daily summaries and review alerts.
          </p>
        </div>
        <Button
          onClick={() => generateDaily.mutate()}
          disabled={generateDaily.isPending}
        >
          {generateDaily.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Generate Daily Summary
        </Button>
      </div>

      {/* Filter tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | 'unread')}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ReminderGroups
            groups={groups}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onMarkRead={(id) => markRead.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="unread">
          <ReminderGroups
            groups={groups}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onMarkRead={(id) => markRead.mutate(id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---- grouped list sub-component ----
function ReminderGroups({
  groups,
  isLoading,
  isError,
  error,
  onMarkRead,
}: {
  groups: Array<{ label: string; items: Reminder[] }>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onMarkRead: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load reminders.{' '}
        {error instanceof Error ? error.message : 'Please try again.'}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <BellOff className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          No reminders yet. Generate your daily summary to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-6">
      {groups.map(({ label, items }) => (
        <section key={label}>
          <h2 className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </h2>
          <Separator className="mb-2" />
          <div className="space-y-0.5">
            {items.map((r) => (
              <ReminderItem key={r.id} reminder={r} onMarkRead={onMarkRead} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
