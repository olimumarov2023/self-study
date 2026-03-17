import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useManualSession } from '@/queries/use-time-tracking';
import { useLearningItems } from '@/queries/use-learning-items';

interface ManualEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualEntryForm({ open, onOpenChange }: ManualEntryFormProps) {
  const [learningItemId, setLearningItemId] = useState<string>('');
  const [startedAt, setStartedAt] = useState('');
  const [endedAt, setEndedAt] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const manualSession = useManualSession();
  const { data: itemsData } = useLearningItems({ limit: 50 });
  const items = itemsData?.data ?? [];

  const resetForm = () => {
    setLearningItemId('');
    setStartedAt('');
    setEndedAt('');
    setNote('');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!startedAt || !endedAt) {
      setError('Start time and end time are required.');
      return;
    }

    const start = new Date(startedAt);
    const end = new Date(endedAt);

    if (end <= start) {
      setError('End time must be after start time.');
      return;
    }

    manualSession.mutate(
      {
        learningItemId: learningItemId || undefined,
        startedAt: start.toISOString(),
        endedAt: end.toISOString(),
        note: note || undefined,
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
        onError: () => {
          setError('Failed to create session. Please try again.');
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) resetForm();
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Manual Time Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manual-item">Learning Item (optional)</Label>
            <Select value={learningItemId} onValueChange={setLearningItemId}>
              <SelectTrigger id="manual-item">
                <SelectValue placeholder="General (no topic)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">General (no topic)</SelectItem>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-start">Start Time</Label>
            <Input
              id="manual-start"
              type="datetime-local"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-end">End Time</Label>
            <Input
              id="manual-end"
              type="datetime-local"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-note">Note (optional)</Label>
            <Textarea
              id="manual-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you study?"
              maxLength={500}
              rows={2}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={manualSession.isPending}>
              {manualSession.isPending ? 'Saving...' : 'Save Entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
