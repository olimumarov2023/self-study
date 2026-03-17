import { z } from 'zod';

export const DayQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected format: YYYY-MM-DD'),
});

export type DayQueryDto = z.infer<typeof DayQuerySchema>;

export const WeekQuerySchema = z.object({
  week: z.string().regex(/^\d{4}-W\d{2}$/, 'Expected format: YYYY-Www'),
});

export type WeekQueryDto = z.infer<typeof WeekQuerySchema>;

export const MonthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Expected format: YYYY-MM'),
});

export type MonthQueryDto = z.infer<typeof MonthQuerySchema>;

export const ScoreTrendQuerySchema = z.object({
  learningItemId: z.string().optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected format: YYYY-MM-DD')
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected format: YYYY-MM-DD')
    .optional(),
});

export type ScoreTrendQueryDto = z.infer<typeof ScoreTrendQuerySchema>;
