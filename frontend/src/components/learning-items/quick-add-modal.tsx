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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/queries/use-categories';

import type { FormEvent } from 'react';
import type { CreateLearningItemPayload } from '@/types/learning-item.types';

interface QuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateLearningItemPayload) => void;
  isPending: boolean;
}

export function QuickAddModal({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: QuickAddModalProps) {
  const { data: categories } = useCategories();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');

  function resetForm() {
    setTitle('');
    setCategoryId('');
  }

  function handleOpenChange(nextOpen: boolean) {
    resetForm();
    onOpenChange(nextOpen);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: CreateLearningItemPayload = {
      title: title.trim(),
    };

    if (categoryId) {
      payload.categoryId = categoryId;
    }

    onSubmit(payload);
    resetForm();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Item</DialogTitle>
          <DialogDescription>
            Add a new learning topic in seconds.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qa-title">Title</Label>
            <Input
              id="qa-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. API test design techniques"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qa-category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="qa-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending && <Loader2 className="animate-spin" />}
              Add Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
