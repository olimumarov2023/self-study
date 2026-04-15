import { useState, useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

function toDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDisplay(yyyyMMdd: string): string {
  const [year, month, day] = yyyyMMdd.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface CalendarDay {
  date: Date;
  dateStr: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

function getCalendarDays(year: number, month: number): CalendarDay[] {
  const today = toDateString(new Date());
  const firstDay = new Date(year, month, 1);
  // Monday = 0, Sunday = 6
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const days: CalendarDay[] = [];

  // Previous month padding
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    const ds = toDateString(d);
    days.push({ date: d, dateStr: ds, day: d.getDate(), isCurrentMonth: false, isToday: ds === today });
  }

  // Current month
  const lastDate = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= lastDate; i++) {
    const d = new Date(year, month, i);
    const ds = toDateString(d);
    days.push({ date: d, dateStr: ds, day: i, isCurrentMonth: true, isToday: ds === today });
  }

  // Next month padding (fill to 42 = 6 rows)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const ds = toDateString(d);
    days.push({ date: d, dateStr: ds, day: i, isCurrentMonth: false, isToday: ds === today });
  }

  return days;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  // Calendar view month (independent from selected date)
  const [viewYear, setViewYear] = useState(() => {
    const [y] = value.split('-');
    return Number(y);
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const [, m] = value.split('-');
    return Number(m) - 1;
  });

  const days = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function selectDate(dateStr: string) {
    onChange(dateStr);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 font-normal">
          <CalendarDays className="h-4 w-4" />
          {formatDisplay(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        {/* Month navigation */}
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

          {/* Day cells */}
          {days.map((day) => (
            <button
              key={day.dateStr}
              onClick={() => selectDate(day.dateStr)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors',
                !day.isCurrentMonth && 'text-muted-foreground/40',
                day.isCurrentMonth && 'hover:bg-accent',
                day.isToday && day.dateStr !== value && 'bg-accent font-semibold',
                day.dateStr === value && 'bg-primary text-primary-foreground font-semibold',
              )}
            >
              {day.day}
            </button>
          ))}
        </div>

        {/* Today shortcut */}
        <div className="mt-2 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              const today = toDateString(new Date());
              const now = new Date();
              setViewYear(now.getFullYear());
              setViewMonth(now.getMonth());
              selectDate(today);
            }}
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
