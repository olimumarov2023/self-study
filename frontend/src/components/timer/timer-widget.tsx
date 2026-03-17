import { useState } from 'react';
import { Play, Square, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TimerDisplay } from '@/components/timer/timer-display';
import { useTimerStore } from '@/stores/timer.store';
import { useStartSession, useStopSession } from '@/queries/use-time-tracking';
import { useLearningItems } from '@/queries/use-learning-items';

export function TimerWidget() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const activeSessionId = useTimerStore((s) => s.activeSessionId);
  const elapsed = useTimerStore((s) => s.elapsed);
  const learningItemTitle = useTimerStore((s) => s.learningItemTitle);
  const isActive = !!activeSessionId;

  const startSession = useStartSession();
  const stopSession = useStopSession();

  const { data: itemsData } = useLearningItems({ limit: 50 });
  const items = itemsData?.data ?? [];

  const handleStart = (learningItemId?: string, title?: string) => {
    startSession.mutate(
      { learningItemId },
      {
        onSuccess: () => {
          // Title is set via the store in the mutation's onSuccess
          // But if we have it from the dropdown, override it
          if (title) {
            useTimerStore.setState({ learningItemTitle: title });
          }
        },
      },
    );
    setDropdownOpen(false);
  };

  const handleStop = () => {
    if (activeSessionId) {
      stopSession.mutate({ id: activeSessionId });
    }
  };

  if (isActive) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <TimerDisplay
            seconds={elapsed}
            className="font-mono text-sm font-medium tabular-nums"
          />
          <span className="max-w-[120px] truncate text-xs text-muted-foreground">
            {learningItemTitle ?? 'General'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleStop}
          disabled={stopSession.isPending}
        >
          <Square className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Play className="h-3.5 w-3.5" />
          Start Timer
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleStart()}>
          General (no topic)
        </DropdownMenuItem>
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onClick={() => handleStart(item.id, item.title)}
          >
            <span className="truncate">{item.title}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
