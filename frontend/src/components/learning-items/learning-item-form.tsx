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
import { useCategories } from '@/queries/use-categories';

import type { FormEvent } from 'react';
import type { LearningItem, UpdateLearningItemPayload } from '@/types/learning-item.types';

interface LearningItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: LearningItem;
  onSubmit: (id: string, data: UpdateLearningItemPayload) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}

export function LearningItemForm({
  open,
  onOpenChange,
  item,
  onSubmit,
  onDelete,
  isPending,
}: LearningItemFormProps) {
  const { data: categories } = useCategories();

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? '');
  const [categoryId, setCategoryId] = useState(item.categoryId ?? 'NONE');

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setTitle(item.title);
      setDescription(item.description ?? '');
      setCategoryId(item.categoryId ?? 'NONE');
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: UpdateLearningItemPayload = {
      title: title.trim(),
      description: description || undefined,
      categoryId: categoryId === 'NONE' ? null : categoryId,
    };

    onSubmit(item.id, payload);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Learning Item</DialogTitle>
          <DialogDescription>
            Update all details for this learning topic.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="li-title">Title</Label>
            <Input
              id="li-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="li-description">Description</Label>
            <Textarea
              id="li-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="li-category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="li-category">
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

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="destructive"
              onClick={() => onDelete(item.id)}
              disabled={isPending}
            >
              Delete
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending && <Loader2 className="animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
