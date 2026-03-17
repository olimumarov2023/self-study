import { z } from 'zod';

export const StopSessionSchema = z.object({
  note: z.string().max(500).optional(),
});

export type StopSessionDto = z.infer<typeof StopSessionSchema>;
