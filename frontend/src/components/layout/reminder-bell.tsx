import { useNavigate } from 'react-router-dom';
import { BellIcon, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useUnreadCount, useReminders, useMarkRead, useGenerateDaily } from '@/queries/use-reminders';
import { timeAgo } from '@/lib/time-ago';
import type { Reminder } from '@/types/reminder.types';

function ReminderRow({
  reminder,
  onRead,
}: {
  reminder: Reminder;
  onRead: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onRead(reminder.id)}
      className="flex w-full flex-col gap-0.5 rounded-md p-2 text-left text-sm transition-colors hover:bg-accent"
    >
      <div className="flex items-center justify-between gap-2">
        <span className={reminder.read ? 'font-normal text-muted-foreground' : 'font-medium'}>
          {reminder.title}
        </span>
        {!reminder.read && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
        )}
      </div>
      <span className="line-clamp-2 text-xs text-muted-foreground">{reminder.body}</span>
      <span className="text-xs text-muted-foreground">{timeAgo(reminder.createdAt)}</span>
    </button>
  );
}

export function ReminderBell() {
  const navigate = useNavigate();

  const { data: countData } = useUnreadCount();
  const { data: reminders, isLoading } = useReminders();
  const markRead = useMarkRead();
  const generateDaily = useGenerateDaily();

  const unreadCount = countData?.count ?? 0;
  const preview = reminders?.slice(0, 5) ?? [];

  function handleRead(id: string) {
    markRead.mutate(id);
    navigate('/reminders');
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Reminders">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold">Reminders</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => generateDaily.mutate()}
            disabled={generateDaily.isPending}
          >
            {generateDaily.isPending ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : null}
            Generate daily summary
          </Button>
        </div>
        <Separator />

        {/* Reminder list */}
        <div className="max-h-80 overflow-y-auto p-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : preview.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No reminders yet.
            </p>
          ) : (
            preview.map((r) => (
              <ReminderRow key={r.id} reminder={r} onRead={handleRead} />
            ))
          )}
        </div>

        <Separator />
        {/* Footer */}
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => navigate('/reminders')}
          >
            View all reminders
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
