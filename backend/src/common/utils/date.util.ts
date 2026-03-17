import { BadRequestException } from '@nestjs/common';

/**
 * Given an ISO week string like "2026-W12", returns the date strings
 * (YYYY-MM-DD) for Monday through Friday of that week.
 *
 * ISO 8601: Week 1 is the week containing the first Thursday of the year,
 * which is equivalent to the week containing January 4th.
 */
export function getWeekDates(weekPeriodKey: string): string[] {
  const match = weekPeriodKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) {
    throw new BadRequestException(`Invalid week format: ${weekPeriodKey}`);
  }

  const year = parseInt(match[1]!, 10);
  const week = parseInt(match[2]!, 10);

  // January 4th is always in ISO week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));

  // Find the Monday of week 1: go back to Monday of the week containing Jan 4
  const jan4DayOfWeek = jan4.getUTCDay(); // 0=Sun, 1=Mon, ...
  const mondayOfWeek1 = new Date(jan4);
  // Convert Sunday(0) to 7 for calculation
  const dayOffset = jan4DayOfWeek === 0 ? 6 : jan4DayOfWeek - 1;
  mondayOfWeek1.setUTCDate(jan4.getUTCDate() - dayOffset);

  // Monday of the target week
  const mondayOfTargetWeek = new Date(mondayOfWeek1);
  mondayOfTargetWeek.setUTCDate(
    mondayOfWeek1.getUTCDate() + (week - 1) * 7,
  );

  const dates: string[] = [];
  for (let i = 0; i < 5; i++) {
    const day = new Date(mondayOfTargetWeek);
    day.setUTCDate(mondayOfTargetWeek.getUTCDate() + i);
    const yyyy = day.getUTCFullYear();
    const mm = String(day.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(day.getUTCDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
  }

  return dates;
}

/**
 * Given an ISO week string like "2026-W12", returns the date strings
 * (YYYY-MM-DD) for Monday through Sunday (all 7 days) of that week.
 */
export function getFullWeekDates(weekPeriodKey: string): string[] {
  const match = weekPeriodKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) {
    throw new BadRequestException(`Invalid week format: ${weekPeriodKey}`);
  }

  const year = parseInt(match[1]!, 10);
  const week = parseInt(match[2]!, 10);

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4DayOfWeek = jan4.getUTCDay();
  const mondayOfWeek1 = new Date(jan4);
  const dayOffset = jan4DayOfWeek === 0 ? 6 : jan4DayOfWeek - 1;
  mondayOfWeek1.setUTCDate(jan4.getUTCDate() - dayOffset);

  const mondayOfTargetWeek = new Date(mondayOfWeek1);
  mondayOfTargetWeek.setUTCDate(
    mondayOfWeek1.getUTCDate() + (week - 1) * 7,
  );

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(mondayOfTargetWeek);
    day.setUTCDate(mondayOfTargetWeek.getUTCDate() + i);
    const yyyy = day.getUTCFullYear();
    const mm = String(day.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(day.getUTCDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
  }

  return dates;
}

/**
 * Given a month string like "2026-03", returns all date strings (YYYY-MM-DD)
 * in that month.
 */
export function getMonthDates(monthKey: string): string[] {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new BadRequestException(`Invalid month format: ${monthKey}`);
  }

  const year = parseInt(match[1]!, 10);
  const month = parseInt(match[2]!, 10);

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const dates: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    dates.push(`${year}-${mm}-${dd}`);
  }

  return dates;
}

/**
 * Format a Date to YYYY-MM-DD string using UTC.
 */
export function formatDateUTC(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
