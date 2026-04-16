import { useState, useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { MultiDatePicker } from '@/components/ui/multi-date-picker';
import { SubItemsList } from '@/components/learning-items/sub-items-list';
import { useCategories } from '@/queries/use-categories';
import { useItemDates, useAssignDates } from '@/queries/use-planning';
import { LearnStatus } from '@/types/enums';

import type { FormEvent } from 'react';
import type { LearningItem, UpdateLearningItemPayload } from '@/types/learning-item.types';

const STATUS_OPTIONS = [
  { value: LearnStatus.TO_LEARN, label: 'To Learn' },
  { value: LearnStatus.PLANNED, label: 'Planned' },
  { value: LearnStatus.IN_PROGRESS, label: 'In Progress' },
  { value: LearnStatus.LEARNED, label: 'Learned' },
  { value: LearnStatus.NEEDS_REVISION, label: 'Needs Revision' },
];

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
  const { data: assignedDates } = useItemDates(item.id);
  const assignDates = useAssignDates();

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? '');
  const [categoryId, setCategoryId] = useState(item.categoryId ?? 'NONE');
  const [status, setStatus] = useState(item.status);

  // Sync state when a different item is opened
  useEffect(() => {
    setTitle(item.title);
    setDescription(item.description ?? '');
    setCategoryId(item.categoryId ?? 'NONE');
    setStatus(item.status);
  }, [item.id, item.title, item.description, item.categoryId, item.status]);

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: UpdateLearningItemPayload = {
      title: title.trim(),
      description: description || undefined,
      categoryId: categoryId === 'NONE' ? null : categoryId,
      status,
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

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="li-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as LearnStatus)}>
                <SelectTrigger id="li-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Scheduled Days</Label>
            <MultiDatePicker
              value={assignedDates ?? []}
              onChange={(dates) => {
                assignDates.mutate({ learningItemId: item.id, dates });
              }}
              disabled={assignDates.isPending}
            />
          </div>

          <Separator />
          <SubItemsList parentId={item.id} />

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
