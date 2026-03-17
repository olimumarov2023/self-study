import { useState } from 'react';
import { Loader2, X } from 'lucide-react';

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
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useCategories } from '@/queries/use-categories';
import { LearnStatus, Priority } from '@/types/enums';

import type { FormEvent } from 'react';
import type { LearningItem, UpdateLearningItemPayload } from '@/types/learning-item.types';

const STATUS_OPTIONS = [
  { value: LearnStatus.TO_LEARN, label: 'To Learn' },
  { value: LearnStatus.PLANNED, label: 'Planned' },
  { value: LearnStatus.IN_PROGRESS, label: 'In Progress' },
  { value: LearnStatus.LEARNED, label: 'Learned' },
  { value: LearnStatus.NEEDS_REVISION, label: 'Needs Revision' },
  { value: LearnStatus.ARCHIVED, label: 'Archived' },
];

const DIFFICULTY_LABELS = ['', 'Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];

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
  const [notes, setNotes] = useState(item.notes ?? '');
  const [categoryId, setCategoryId] = useState(item.categoryId ?? 'NONE');
  const [priority, setPriority] = useState(item.priority);
  const [difficulty, setDifficulty] = useState(item.difficulty);
  const [estimatedHours, setEstimatedHours] = useState(
    item.estimatedHours != null ? String(item.estimatedHours) : '',
  );
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(item.tags);
  const [targetRole, setTargetRole] = useState(item.targetRole ?? '');
  const [dueDate, setDueDate] = useState(
    item.dueDate ? item.dueDate.split('T')[0] ?? '' : '',
  );
  const [status, setStatus] = useState(item.status);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setTitle(item.title);
      setDescription(item.description ?? '');
      setNotes(item.notes ?? '');
      setCategoryId(item.categoryId ?? 'NONE');
      setPriority(item.priority);
      setDifficulty(item.difficulty);
      setEstimatedHours(
        item.estimatedHours != null ? String(item.estimatedHours) : '',
      );
      setTags(item.tags);
      setTagInput('');
      setTargetRole(item.targetRole ?? '');
      setDueDate(item.dueDate ? item.dueDate.split('T')[0] ?? '' : '');
      setStatus(item.status);
    }
    onOpenChange(nextOpen);
  }

  function handleAddTag() {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }

  function handleRemoveTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: UpdateLearningItemPayload = {
      title: title.trim(),
      description: description || undefined,
      notes: notes || undefined,
      categoryId: categoryId === 'NONE' ? null : categoryId,
      priority,
      difficulty,
      estimatedHours: estimatedHours ? Number(estimatedHours) : null,
      tags,
      targetRole: targetRole || null,
      dueDate: dueDate || null,
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

          <div className="space-y-2">
            <Label htmlFor="li-notes">Notes</Label>
            <Textarea
              id="li-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Study notes, links, etc."
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="li-priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger id="li-priority">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Priority.LOW}>Low</SelectItem>
                  <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={Priority.HIGH}>High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="li-hours">Estimated Hours</Label>
              <Input
                id="li-hours"
                type="number"
                min={0.5}
                step={0.5}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="e.g. 4"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Difficulty: {DIFFICULTY_LABELS[difficulty] ?? `${difficulty}/5`} ({difficulty}/5)
            </Label>
            <Slider
              value={[difficulty]}
              onValueChange={(val) => setDifficulty(val[0] ?? 3)}
              min={1}
              max={5}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="li-tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="li-tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Type and press Enter"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="li-target-role">Target Role</Label>
              <Input
                id="li-target-role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior QA Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="li-due-date">Due Date</Label>
              <Input
                id="li-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
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
