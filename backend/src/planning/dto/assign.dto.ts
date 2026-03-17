import { z } from 'zod';

export const AssignSchema = z.object({
  learningItemId: z.string().cuid('Invalid learning item ID'),
  level: z.enum(['MONTHLY', 'WEEKLY', 'DAILY']),
  periodKey: z.string().min(1, 'Period key is required'),
}).refine(
  (data) => {
    if (data.level === 'MONTHLY') return /^\d{4}-\d{2}$/.test(data.periodKey);
    if (data.level === 'WEEKLY') return /^\d{4}-W\d{2}$/.test(data.periodKey);
    if (data.level === 'DAILY') return /^\d{4}-\d{2}-\d{2}$/.test(data.periodKey);
    return false;
  },
  {
    message:
      'periodKey format must match level: MONTHLY="2026-03", WEEKLY="2026-W12", DAILY="2026-03-17"',
    path: ['periodKey'],
  },
);

export type AssignDto = z.infer<typeof AssignSchema>;
