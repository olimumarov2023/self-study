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

interface BoardFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
}

export function BoardFilters({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
}: BoardFiltersProps) {
  const { data: categories } = useCategories();

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search input */}
      <div className="relative w-full sm:w-auto">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search cards..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 sm:w-56"
        />
      </div>

      {/* Category filter */}
      <Select value={categoryId} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories?.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: cat.color ?? '#6b7280' }}
                />
                {cat.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
