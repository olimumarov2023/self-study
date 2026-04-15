import { Trash2, BookOpen, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookStatusBadge } from './book-status-badge';
import { useDeleteBook } from '@/queries/use-study-tracker';

import type { StudyBook } from '@/types/study-tracker.types';

interface BookCardProps {
  book: StudyBook;
  onSelect: (book: StudyBook) => void;
}

export function BookCard({ book, onSelect }: BookCardProps) {
  const deleteBook = useDeleteBook();

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (window.confirm(`Delete "${book.title}"? All chapters and topics will be lost.`)) {
      deleteBook.mutate(book.id);
    }
  }

  const progress = Math.round(book.progressPercent);

  return (
    <Card
      className="flex flex-col cursor-pointer transition-all hover:border-primary/40 hover:shadow-md"
      onClick={() => onSelect(book)}
    >
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <BookStatusBadge status={book.status} />
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteBook.isPending}
              aria-label="Delete book"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Title + author */}
        <div className="min-w-0">
          <p className="font-semibold leading-snug text-foreground truncate">
            {book.title}
          </p>
          {book.author && (
            <p className="mt-0.5 text-sm text-muted-foreground truncate">
              {book.author}
            </p>
          )}
          {book.description && (
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
              {book.description}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-medium tabular-nums">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stats footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {book.completedChapters}/{book.totalChapters} chapters
            </span>
            <span>
              {book.learnedTopics}/{book.totalTopics} topics
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        </div>
      </CardContent>
    </Card>
  );
}
