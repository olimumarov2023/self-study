import { useState, useRef } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToggleTopicLearned, useDeleteTopic, useUpdateTopic } from '@/queries/use-study-tracker';

import type { StudyTopic } from '@/types/study-tracker.types';

interface TopicRowProps {
  topic: StudyTopic;
  bookId: string;
}

export function TopicRow({ topic, bookId }: TopicRowProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(topic.notes ?? '');
  const [hovered, setHovered] = useState(false);
  const notesRef = useRef<HTMLInputElement>(null);

  const toggleLearned = useToggleTopicLearned();
  const deleteTopic = useDeleteTopic();
  const updateTopic = useUpdateTopic();

  function handleToggle() {
    toggleLearned.mutate({ id: topic.id, bookId });
  }

  function handleDelete() {
    if (window.confirm(`Delete topic "${topic.title}"?`)) {
      deleteTopic.mutate({ id: topic.id, bookId });
    }
  }

  function handleSaveNotes() {
    const trimmed = notesValue.trim();
    updateTopic.mutate(
      {
        id: topic.id,
        bookId,
        payload: { notes: trimmed || undefined },
      },
      {
        onSuccess: () => setIsEditingNotes(false),
      },
    );
  }

  function handleNotesKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveNotes();
    } else if (e.key === 'Escape') {
      setNotesValue(topic.notes ?? '');
      setIsEditingNotes(false);
    }
  }

  const isToggling = toggleLearned.isPending;

  return (
    <div
      className="group flex flex-col gap-1 rounded-md px-2 py-2 transition-colors hover:bg-accent/50"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-3">
        {/* Custom checkbox */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={isToggling}
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
            topic.learned
              ? 'border-green-500 bg-green-500 text-white'
              : 'border-muted-foreground/40 bg-transparent hover:border-green-400',
            isToggling && 'opacity-50',
          )}
          aria-label={topic.learned ? 'Mark as not learned' : 'Mark as learned'}
        >
          {topic.learned && <Check className="h-3 w-3 stroke-[3]" />}
        </button>

        {/* Topic title */}
        <span
          className={cn(
            'flex-1 text-sm leading-snug transition-all duration-200',
            topic.learned && 'line-through text-muted-foreground',
          )}
        >
          {topic.title}
        </span>

        {/* Action buttons (visible on hover) */}
        <div
          className={cn(
            'flex items-center gap-1 transition-opacity duration-150',
            hovered ? 'opacity-100' : 'opacity-0',
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setIsEditingNotes(true);
              setTimeout(() => notesRef.current?.focus(), 50);
            }}
            aria-label="Edit notes"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleteTopic.isPending}
            aria-label="Delete topic"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Notes row */}
      {isEditingNotes ? (
        <div className="ml-8 flex items-center gap-2">
          <Input
            ref={notesRef}
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            onKeyDown={handleNotesKeyDown}
            placeholder="Add notes..."
            className="h-7 text-xs"
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            onClick={handleSaveNotes}
            disabled={updateTopic.isPending}
            aria-label="Save notes"
          >
            <Check className="h-3.5 w-3.5 text-green-600" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            onClick={() => {
              setNotesValue(topic.notes ?? '');
              setIsEditingNotes(false);
            }}
            aria-label="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        topic.notes && (
          <p
            className="ml-8 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              setIsEditingNotes(true);
              setTimeout(() => notesRef.current?.focus(), 50);
            }}
          >
            {topic.notes}
          </p>
        )
      )}
    </div>
  );
}
