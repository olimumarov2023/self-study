import { useState, useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

interface MultiDatePickerProps {
  value: string[]; // YYYY-MM-DD[]
  onChange: (dates: string[]) => void;
  disabled?: boolean;
}

function toDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

interface CalendarDay {
  dateStr: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

function getCalendarDays(year: number, month: number): CalendarDay[] {
  const today = toDateString(new Date());
  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const days: CalendarDay[] = [];

  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    const ds = toDateString(d);
    days.push({ dateStr: ds, day: d.getDate(), isCurrentMonth: false, isToday: ds === today });
  }

  const lastDate = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= lastDate; i++) {
    const d = new Date(year, month, i);
    const ds = toDateString(d);
    days.push({ dateStr: ds, day: i, isCurrentMonth: true, isToday: ds === today });
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const ds = toDateString(d);
    days.push({ dateStr: ds, day: i, isCurrentMonth: false, isToday: ds === today });
  }

  return days;
}

function buildRange(a: string, b: string): string[] {
  const start = a < b ? a : b;
  const end = a < b ? b : a;
  const dates: string[] = [];
  const cur = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');
  while (cur <= endDate) {
    dates.push(toDateString(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function MultiDatePicker({ value, onChange, disabled }: MultiDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedSet = useMemo(() => new Set(value), [value]);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  // Two-click range: first click = "from", second click = "to"
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Preview range while hovering after first click
  const previewSet = useMemo(() => {
    if (!rangeStart || !hoverDate) return new Set<string>();
    return new Set(buildRange(rangeStart, hoverDate));
  }, [rangeStart, hoverDate]);

  const days = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else { setViewMonth((m) => m - 1); }
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else { setViewMonth((m) => m + 1); }
  }

  function handleClick(dateStr: string) {
    if (!rangeStart) {
      // First click — set the "from" date
      setRangeStart(dateStr);
    } else {
      // Second click — complete the range (replaces previous selection)
      const rangeDates = buildRange(rangeStart, dateStr);
      onChange(rangeDates);
      setRangeStart(null);
      setHoverDate(null);
    }
  }

  function clearAll() {
    onChange([]);
    setRangeStart(null);
    setHoverDate(null);
  }

  const label = value.length === 0
    ? 'Select dates'
    : value.length === 1
      ? formatShort(value[0]!)
      : `${value.length} days selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 font-normal justify-start" disabled={disabled}>
          <CalendarDays className="h-4 w-4" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        {/* Month nav */}
        <div className="mb-2 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">{monthLabel}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-0">
          {WEEKDAYS.map((d) => (
            <div key={d} className="flex h-8 w-8 items-center justify-center text-[11px] font-medium text-muted-foreground">
              {d}
            </div>
          ))}

          {days.map((day) => {
            const isSelected = selectedSet.has(day.dateStr);
            const isRangeStart = day.dateStr === rangeStart;
            const isInPreview = previewSet.has(day.dateStr);
            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => handleClick(day.dateStr)}
                onMouseEnter={() => { if (rangeStart) setHoverDate(day.dateStr); }}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors',
                  !day.isCurrentMonth && 'text-muted-foreground/40',
                  day.isCurrentMonth && !isSelected && !isInPreview && 'hover:bg-accent',
                  day.isToday && !isSelected && !isInPreview && 'bg-accent font-semibold',
                  isInPreview && !isSelected && 'bg-primary/20',
                  isSelected && 'bg-primary text-primary-foreground font-semibold',
                  isRangeStart && 'ring-2 ring-primary',
                )}
              >
                {day.day}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {rangeStart
              ? 'Click end date'
              : value.length > 0
                ? `${value.length} selected`
                : 'Click start date'}
          </span>
          {value.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAll}>
              Clear all
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function formatShort(yyyyMMdd: string): string {
  const [year, month, day] = yyyyMMdd.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
