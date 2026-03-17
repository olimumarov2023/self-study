import { useState } from 'react';
import { Shuffle, CheckCircle2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAutoDistribute } from '@/queries/use-planning';

interface AutoDistributeButtonProps {
  weekPeriodKey: string;
}

export function AutoDistributeButton({ weekPeriodKey }: AutoDistributeButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const autoDistribute = useAutoDistribute();

  function handleClick() {
    setFeedback(null);
    autoDistribute.mutate(
      { weekPeriodKey },
      {
        onSuccess: (data) => {
          if (data.created === 0) {
            setFeedback('No new items to distribute.');
          } else {
            setFeedback(`Distributed ${data.created} item${data.created > 1 ? 's' : ''} across the week.`);
          }
          setTimeout(() => setFeedback(null), 4000);
        },
        onError: () => {
          setFeedback('Failed to auto-distribute. Try again.');
          setTimeout(() => setFeedback(null), 4000);
        },
      },
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={autoDistribute.isPending}
      >
        {autoDistribute.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Shuffle className="mr-2 h-4 w-4" />
        )}
        Auto-distribute
      </Button>

      {feedback && (
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          {feedback}
        </span>
      )}
    </div>
  );
}
