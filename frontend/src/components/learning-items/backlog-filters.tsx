import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/queries/use-categories';
import { LearnStatus, Priority } from '@/types/enums';

import type { LearningItemsQuery } from '@/types/learning-item.types';

const STATUS_OPTIONS = [
  { value: LearnStatus.TO_LEARN, label: 'To Learn' },
  { value: LearnStatus.PLANNED, label: 'Planned' },
  { value: LearnStatus.IN_PROGRESS, label: 'In Progress' },
  { value: LearnStatus.LEARNED, label: 'Learned' },
  { value: LearnStatus.NEEDS_REVISION, label: 'Needs Revision' },
  { value: LearnStatus.ARCHIVED, label: 'Archived' },
];

const PRIORITY_OPTIONS = [
  { value: Priority.LOW, label: 'Low' },
  { value: Priority.MEDIUM, label: 'Medium' },
  { value: Priority.HIGH, label: 'High' },
];

interface BacklogFiltersProps {
  filters: LearningItemsQuery;
  onFiltersChange: (filters: LearningItemsQuery) => void;
}

export function BacklogFilters({ filters, onFiltersChange }: BacklogFiltersProps) {
  const { data: categories } = useCategories();

  function handleSearchChange(value: string) {
    onFiltersChange({ ...filters, search: value || undefined, offset: 0 });
  }

  function handleStatusChange(value: string) {
    onFiltersChange({
      ...filters,
      status: value === 'ALL' ? undefined : (value as LearningItemsQuery['status']),
      offset: 0,
    });
  }

  function handlePriorityChange(value: string) {
    onFiltersChange({
      ...filters,
      priority: value === 'ALL' ? undefined : (value as LearningItemsQuery['priority']),
      offset: 0,
    });
  }

  function handleCategoryChange(value: string) {
    onFiltersChange({
      ...filters,
      categoryId: value === 'ALL' ? undefined : value,
      offset: 0,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full min-w-[200px] sm:flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={filters.search ?? ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.status ?? 'ALL'}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority ?? 'ALL'}
        onValueChange={handlePriorityChange}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Priorities</SelectItem>
          {PRIORITY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.categoryId ?? 'ALL'}
        onValueChange={handleCategoryChange}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Categories</SelectItem>
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
  );
}
