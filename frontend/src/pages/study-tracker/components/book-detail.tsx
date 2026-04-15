import { useState } from 'react';
import {
  ArrowLeft,
  Download,
  Plus,
  Loader2,
  BookOpen,
  ListChecks,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChapterSection } from './chapter-section';
import { InlineInput } from './inline-input';
import { useStudyBook, useCreateChapter, useUpdateBook } from '@/queries/use-study-tracker';
import { studyTrackerApi } from '@/api/study-tracker.api';

import type { StudyBookStatus } from '@/types/study-tracker.types';

interface BookDetailProps {
  bookId: string;
  onBack: () => void;
}

export function BookDetail({ bookId, onBack }: BookDetailProps) {
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: book, isLoading, isError } = useStudyBook(bookId);
  const createChapter = useCreateChapter();
  const updateBook = useUpdateBook();

  function handleAddChapter(title: string) {
    createChapter.mutate(
      {
        bookId,
        payload: { title, sortOrder: book?.chapters?.length ?? 0 },
      },
      { onSuccess: () => setShowAddChapter(false) },
    );
  }

  function handleStatusChange(status: StudyBookStatus) {
    updateBook.mutate({ id: bookId, payload: { status } });
  }

  async function handleExport() {
    if (!book) return;
    setIsExporting(true);
    try {
      const fileName = `${book.title.replace(/[^a-z0-9]/gi, '_')}_study_tracker.csv`;
      await studyTrackerApi.exportBook(bookId, fileName);
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !book) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load book details. Please try again.
        </div>
      </div>
    );
  }

  const progress = Math.round(book.progressPercent);
  const sortedChapters = [...(book.chapters ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <div className="space-y-6">
      {/* Back + Export bar */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          All Books
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="gap-1.5"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export Excel
        </Button>
      </div>

      {/* Book header */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight leading-tight">
              {book.title}
            </h2>
            {book.author && (
              <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
            )}
            {book.description && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-prose">
                {book.description}
              </p>
            )}
          </div>

          {/* Status selector */}
          <div className="shrink-0">
            <Select value={book.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall progress</span>
            <span className="font-semibold tabular-nums">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className={progress === 100 ? '[&>div]:bg-green-500' : ''}
          />
        </div>

        {/* Stats row */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>
              <span className="font-semibold text-foreground">{book.completedChapters}</span>
              /{book.totalChapters} chapters done
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ListChecks className="h-4 w-4" />
            <span>
              <span className="font-semibold text-foreground">{book.learnedTopics}</span>
              /{book.totalTopics} topics learned
            </span>
          </div>
        </div>
      </div>

      {/* Chapters section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Chapters</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddChapter(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Chapter
          </Button>
        </div>

        {/* Add chapter inline input */}
        {showAddChapter && (
          <InlineInput
            placeholder="Chapter title... (Enter to add, Esc to cancel)"
            onSubmit={handleAddChapter}
            onCancel={() => setShowAddChapter(false)}
          />
        )}

        {/* Empty chapters state */}
        {sortedChapters.length === 0 && !showAddChapter && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/40" />
            <div>
              <p className="font-medium">No chapters yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first chapter to start organizing topics.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowAddChapter(true)}>
              <Plus className="h-4 w-4" />
              Add Chapter
            </Button>
          </div>
        )}

        {/* Chapters list */}
        <div className="space-y-3">
          {sortedChapters.map((chapter) => (
            <ChapterSection
              key={chapter.id}
              chapter={chapter}
              bookId={book.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
