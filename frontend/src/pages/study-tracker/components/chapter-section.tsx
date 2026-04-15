import { useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Trash2, Plus, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TopicRow } from './topic-row';
import { InlineInput } from './inline-input';
import {
  useDeleteChapter,
  useUpdateChapter,
  useCreateTopic,
} from '@/queries/use-study-tracker';

import type { StudyChapter } from '@/types/study-tracker.types';

interface ChapterSectionProps {
  chapter: StudyChapter;
  bookId: string;
  defaultExpanded?: boolean;
}

export function ChapterSection({ chapter, bookId, defaultExpanded = true }: ChapterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(chapter.title);
  const [showAddTopic, setShowAddTopic] = useState(false);

  const deleteChapter = useDeleteChapter();
  const updateChapter = useUpdateChapter();
  const createTopic = useCreateTopic();

  const learnedCount = chapter.topics.filter((t) => t.learned).length;
  const totalCount = chapter.topics.length;
  const allLearned = totalCount > 0 && learnedCount === totalCount;

  function handleDeleteChapter() {
    if (window.confirm(`Delete chapter "${chapter.title}" and all its topics?`)) {
      deleteChapter.mutate({ id: chapter.id, bookId });
    }
  }

  function handleSaveTitle() {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === chapter.title) {
      setEditTitle(chapter.title);
      setIsEditingTitle(false);
      return;
    }
    updateChapter.mutate(
      { id: chapter.id, bookId, payload: { title: trimmed } },
      { onSuccess: () => setIsEditingTitle(false) },
    );
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSaveTitle();
    else if (e.key === 'Escape') {
      setEditTitle(chapter.title);
      setIsEditingTitle(false);
    }
  }

  function handleAddTopic(title: string) {
    createTopic.mutate(
      {
        chapterId: chapter.id,
        bookId,
        payload: { title, sortOrder: chapter.topics.length },
      },
      { onSuccess: () => setShowAddTopic(false) },
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-card transition-colors',
        allLearned && 'border-green-200 dark:border-green-900',
      )}
    >
      {/* Chapter header */}
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
          aria-label={isExpanded ? 'Collapse chapter' : 'Expand chapter'}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {isEditingTitle ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              className="h-7 text-sm font-medium"
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={handleSaveTitle}
              disabled={updateChapter.isPending}
            >
              <Check className="h-3.5 w-3.5 text-green-600" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={() => {
                setEditTitle(chapter.title);
                setIsEditingTitle(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="flex-1 text-left text-sm font-semibold hover:text-primary transition-colors truncate"
            onClick={() => setIsExpanded((v) => !v)}
          >
            {chapter.title}
          </button>
        )}

        {/* Topics learned badge */}
        <Badge
          variant="outline"
          className={cn(
            'shrink-0 text-xs tabular-nums',
            allLearned
              ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
              : 'text-muted-foreground',
          )}
        >
          {learnedCount}/{totalCount}
        </Badge>

        {/* Chapter actions */}
        {!isEditingTitle && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity [.chapter-section:hover_&]:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsEditingTitle(true)}
              aria-label="Edit chapter title"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={handleDeleteChapter}
              disabled={deleteChapter.isPending}
              aria-label="Delete chapter"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Topics list */}
      {isExpanded && (
        <div className="border-t px-2 pb-2">
          {chapter.topics.length === 0 && !showAddTopic && (
            <p className="py-3 text-center text-xs text-muted-foreground">
              No topics yet. Add your first topic below.
            </p>
          )}

          <div className="mt-1 space-y-0.5">
            {chapter.topics.map((topic) => (
              <TopicRow key={topic.id} topic={topic} bookId={bookId} />
            ))}
          </div>

          {/* Add topic inline */}
          {showAddTopic ? (
            <div className="mt-2 px-2">
              <InlineInput
                placeholder="Topic title... (Enter to add, Esc to cancel)"
                onSubmit={handleAddTopic}
                onCancel={() => setShowAddTopic(false)}
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 w-full justify-start gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowAddTopic(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add topic
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
