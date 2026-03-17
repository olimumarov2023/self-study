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

import type { FormEvent } from 'react';
import type { Category } from '@/types/category.types';

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSubmit: (data: { name: string; color?: string; weightGoal?: number }) => void;
  isPending: boolean;
}

export function CategoryForm({
  open,
  onOpenChange,
  category,
  onSubmit,
  isPending,
}: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? '#3b82f6');
  const [weightGoal, setWeightGoal] = useState(
    category?.weightGoal != null ? String(category.weightGoal) : '',
  );

  // Reset form when dialog opens/closes or category changes
  const isEdit = !!category;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      color,
      weightGoal: weightGoal ? Number(weightGoal) : undefined,
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setName(category?.name ?? '');
      setColor(category?.color ?? '#3b82f6');
      setWeightGoal(
        category?.weightGoal != null ? String(category.weightGoal) : '',
      );
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Category' : 'Create Category'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the category details below.'
              : 'Add a new learning category.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Automation"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-color">Color</Label>
            <div className="flex items-center gap-3">
              <input
                id="cat-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border bg-transparent p-0.5"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-weight">Weight Goal (%)</Label>
            <Input
              id="cat-weight"
              type="number"
              min={0}
              max={100}
              value={weightGoal}
              onChange={(e) => setWeightGoal(e.target.value)}
              placeholder="e.g. 25"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
