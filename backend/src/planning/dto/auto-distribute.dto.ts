import { z } from 'zod';

export const AutoDistributeSchema = z.object({
  weekPeriodKey: z
    .string()
    .regex(/^\d{4}-W\d{2}$/, 'weekPeriodKey must be in format "2026-W12"'),
});

export type AutoDistributeDto = z.infer<typeof AutoDistributeSchema>;
