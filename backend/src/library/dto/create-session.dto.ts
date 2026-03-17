import { z } from 'zod';

export const CreateSessionSchema = z.object({
  startPage: z.number().int().optional(),
  endPage: z.number().int().optional(),
  startMinute: z.number().int().optional(),
  endMinute: z.number().int().optional(),
  notes: z.string().optional(),
  sessionDate: z.string().datetime().optional(),
  durationMin: z.number().int().min(0).default(0),
});

export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;
