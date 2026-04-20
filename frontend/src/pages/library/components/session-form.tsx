import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateSession } from '@/queries/use-library';

import type { FormEvent } from 'react';
import type { LibraryResource } from '@/types/library.types';

interface SessionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: LibraryResource;
  onSuccess?: () => void;
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

export function SessionForm({
  open,
  onOpenChange,
  resource,
  onSuccess,
}: SessionFormProps) {
  const createSession = useCreateSession();

  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [startMinute, setStartMinute] = useState('');
  const [endMinute, setEndMinute] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [sessionDate, setSessionDate] = useState(todayIso());
  const [notes, setNotes] = useState('');

  function reset() {
    setStartPage('');
    setEndPage('');
    setStartMinute('');
    setEndMinute('');
    setDurationMin('');
    setSessionDate(todayIso());
    setNotes('');
  }

  function handleOpenChange(next: boolean) {
    if (next) reset();
    onOpenChange(next);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    createSession.mutate(
      {
        resourceId: resource.id,
        payload: {
          startPage: startPage ? Number(startPage) : undefined,
          endPage: endPage ? Number(endPage) : undefined,
          startMinute: startMinute ? Number(startMinute) : undefined,
          endMinute: endMinute ? Number(endMinute) : undefined,
          durationMin: durationMin ? Number(durationMin) : undefined,
          sessionDate: sessionDate || undefined,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      },
    );
  }

  const isBook = resource.type === 'BOOK';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Session</DialogTitle>
          <DialogDescription>
            Record your progress for &ldquo;{resource.title}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Book fields */}
          {isBook && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sess-start-page">Start Page</Label>
                <Input
                  id="sess-start-page"
                  type="number"
                  min={1}
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value)}
                  placeholder={
                    resource.currentPage != null
                      ? String(resource.currentPage)
                      : '1'
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sess-end-page">End Page</Label>
                <Input
                  id="sess-end-page"
                  type="number"
                  min={1}
                  value={endPage}
                  onChange={(e) => setEndPage(e.target.value)}
                  placeholder={
                    resource.totalPages != null
                      ? String(resource.totalPages)
                      : ''
                  }
                />
              </div>
            </div>
          )}

          {/* Video fields */}
          {!isBook && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sess-start-min">Start (minutes)</Label>
                <Input
                  id="sess-start-min"
                  type="number"
                  min={0}
                  value={startMinute}
                  onChange={(e) => setStartMinute(e.target.value)}
                  placeholder={
                    resource.watchedMinutes != null
                      ? String(resource.watchedMinutes)
                      : '0'
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sess-end-min">End (minutes)</Label>
                <Input
                  id="sess-end-min"
                  type="number"
                  min={0}
                  value={endMinute}
                  onChange={(e) => setEndMinute(e.target.value)}
                  placeholder={
                    resource.totalMinutes != null
                      ? String(resource.totalMinutes)
                      : ''
                  }
                />
              </div>
            </div>
          )}

          {/* Duration + date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sess-duration">Duration (min)</Label>
              <Input
                id="sess-duration"
                type="number"
                min={1}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder="e.g. 45"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sess-date">Date</Label>
              <Input
                id="sess-date"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="sess-notes">Notes</Label>
            <Textarea
              id="sess-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you cover? Any key takeaways..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createSession.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSession.isPending}>
              {createSession.isPending && <Loader2 className="animate-spin" />}
              Log Session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
