import { z } from 'zod';

export const ManualSessionSchema = z.object({
  learningItemId: z.string().optional(),
  startedAt: z.string().datetime({ message: 'startedAt must be a valid ISO date string' }),
  endedAt: z.string().datetime({ message: 'endedAt must be a valid ISO date string' }),
  note: z.string().max(500).optional(),
}).refine(
  (data) => new Date(data.endedAt) > new Date(data.startedAt),
  { message: 'endedAt must be after startedAt', path: ['endedAt'] },
);

export type ManualSessionDto = z.infer<typeof ManualSessionSchema>;
