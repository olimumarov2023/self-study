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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useCategories } from '@/queries/use-categories';
import { useCreateResource, useUpdateResource } from '@/queries/use-library';

import type { FormEvent } from 'react';
import type {
  LibraryResource,
  ResourceType,
  CreateResourcePayload,
  UpdateResourcePayload,
} from '@/types/library.types';

interface ResourceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a resource to edit; omit for create mode. */
  resource?: LibraryResource;
  /** Pre-select a type when opening in create mode. */
  defaultType?: ResourceType;
  onSuccess?: () => void;
}

export function ResourceForm({
  open,
  onOpenChange,
  resource,
  defaultType = 'BOOK',
  onSuccess,
}: ResourceFormProps) {
  const isEdit = !!resource;

  const { data: categories } = useCategories();
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();

  const isPending = createResource.isPending || updateResource.isPending;

  // --- form state ---
  const [type, setType] = useState<ResourceType>(resource?.type ?? defaultType);
  const [title, setTitle] = useState(resource?.title ?? '');
  const [author, setAuthor] = useState(resource?.author ?? '');
  const [url, setUrl] = useState(resource?.url ?? '');
  const [totalPages, setTotalPages] = useState(
    resource?.totalPages != null ? String(resource.totalPages) : '',
  );
  const [totalMinutes, setTotalMinutes] = useState(
    resource?.totalMinutes != null ? String(resource.totalMinutes) : '',
  );
  const [categoryId, setCategoryId] = useState(resource?.categoryId ?? 'NONE');
  const [notes, setNotes] = useState(resource?.notes ?? '');

  function resetToResource(r?: LibraryResource, dt: ResourceType = 'BOOK') {
    setType(r?.type ?? dt);
    setTitle(r?.title ?? '');
    setAuthor(r?.author ?? '');
    setUrl(r?.url ?? '');
    setTotalPages(r?.totalPages != null ? String(r.totalPages) : '');
    setTotalMinutes(r?.totalMinutes != null ? String(r.totalMinutes) : '');
    setCategoryId(r?.categoryId ?? 'NONE');
    setNotes(r?.notes ?? '');
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      resetToResource(resource, defaultType);
    }
    onOpenChange(next);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const resolvedCategoryId = categoryId === 'NONE' ? undefined : categoryId;

    if (isEdit && resource) {
      const payload: UpdateResourcePayload = {
        title: title.trim(),
        author: author.trim() || undefined,
        url: url.trim() || undefined,
        totalPages: totalPages ? Number(totalPages) : undefined,
        totalMinutes: totalMinutes ? Number(totalMinutes) : undefined,
        categoryId: resolvedCategoryId,
        notes: notes.trim() || undefined,
      };
      updateResource.mutate(
        { id: resource.id, payload },
        {
          onSuccess: () => {
            onOpenChange(false);
            onSuccess?.();
          },
        },
      );
    } else {
      const payload: CreateResourcePayload = {
        type,
        title: title.trim(),
        author: author.trim() || undefined,
        url: url.trim() || undefined,
        totalPages: totalPages ? Number(totalPages) : undefined,
        totalMinutes: totalMinutes ? Number(totalMinutes) : undefined,
        categoryId: resolvedCategoryId,
        notes: notes.trim() || undefined,
      };
      createResource.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details for this resource.'
              : 'Add a book or video to your library.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle — only shown in create mode */}
          {!isEdit && (
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex rounded-md border">
                {(['BOOK', 'VIDEO'] as ResourceType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      'flex-1 py-2 text-sm font-medium transition-colors first:rounded-l-md last:rounded-r-md',
                      type === t
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    {t === 'BOOK' ? 'Book' : 'Video'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="res-title">Title</Label>
            <Input
              id="res-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'BOOK' ? 'e.g. Clean Code' : 'e.g. TypeScript Full Course'}
              autoFocus
              required
            />
          </div>

          {/* Conditional fields */}
          {type === 'BOOK' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="res-author">Author</Label>
                <Input
                  id="res-author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Robert C. Martin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="res-pages">Total Pages</Label>
                <Input
                  id="res-pages"
                  type="number"
                  min={1}
                  value={totalPages}
                  onChange={(e) => setTotalPages(e.target.value)}
                  placeholder="e.g. 464"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="res-url">Video URL</Label>
                <Input
                  id="res-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="res-minutes">Total Duration (minutes)</Label>
                <Input
                  id="res-minutes"
                  type="number"
                  min={1}
                  value={totalMinutes}
                  onChange={(e) => setTotalMinutes(e.target.value)}
                  placeholder="e.g. 240"
                />
              </div>
            </div>
          )}

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="res-category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="res-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">No Category</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      {cat.color && (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                      )}
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="res-notes">Notes</Label>
            <Textarea
              id="res-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes, links, context..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Resource'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
