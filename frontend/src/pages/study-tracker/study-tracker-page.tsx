import { useState } from 'react';
import { GraduationCap, Plus, Loader2, Library } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useStudyBooks } from '@/queries/use-study-tracker';
import { AddBookDialog } from './components/add-book-dialog';
import { BookCard } from './components/book-card';
import { BookDetail } from './components/book-detail';

import type { StudyBook } from '@/types/study-tracker.types';

export function StudyTrackerPage() {
  const [addBookOpen, setAddBookOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const { data: books, isLoading, isError } = useStudyBooks();

  const totalTopics = books?.reduce((sum, b) => sum + b.totalTopics, 0) ?? 0;
  const learnedTopics = books?.reduce((sum, b) => sum + b.learnedTopics, 0) ?? 0;
  const completedChapters = books?.reduce((sum, b) => sum + b.completedChapters, 0) ?? 0;
  const totalChapters = books?.reduce((sum, b) => sum + b.totalChapters, 0) ?? 0;

  // Show detail view when a book is selected
  if (selectedBookId) {
    return (
      <BookDetail
        bookId={selectedBookId}
        onBack={() => setSelectedBookId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <GraduationCap className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Study Tracker</h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            Track books and syllabi — mark topics as learned, see your progress.
          </p>
        </div>
        <Button onClick={() => setAddBookOpen(true)} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Add Book
        </Button>
      </div>

      {/* Stats bar */}
      {!isLoading && (books?.length ?? 0) > 0 && (
        <div className="grid grid-cols-3 gap-3 rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-0.5 text-center">
            <span className="text-2xl font-bold tabular-nums text-primary">
              {books!.length}
            </span>
            <span className="text-xs text-muted-foreground">
              {books!.length === 1 ? 'Book' : 'Books'}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 text-center border-x">
            <span className="text-2xl font-bold tabular-nums text-primary">
              {completedChapters}
              <span className="text-base font-normal text-muted-foreground">
                /{totalChapters}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">Chapters done</span>
          </div>
          <div className="flex flex-col gap-0.5 text-center">
            <span className="text-2xl font-bold tabular-nums text-primary">
              {learnedTopics}
              <span className="text-base font-normal text-muted-foreground">
                /{totalTopics}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">Topics learned</span>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load your study books. Please refresh and try again.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && (books?.length ?? 0) === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
          <Library className="h-12 w-12 text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="text-lg font-semibold">No books yet</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Add a book or syllabus to start tracking your study progress, chapter by chapter.
            </p>
          </div>
          <Button onClick={() => setAddBookOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add your first book
          </Button>
        </div>
      )}

      {/* Book grid */}
      {!isLoading && !isError && (books?.length ?? 0) > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {books!.map((book: StudyBook) => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={(b) => setSelectedBookId(b.id)}
            />
          ))}
        </div>
      )}

      {/* Add Book dialog */}
      <AddBookDialog open={addBookOpen} onOpenChange={setAddBookOpen} />
    </div>
  );
}
