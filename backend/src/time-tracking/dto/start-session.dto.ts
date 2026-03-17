import { z } from 'zod';

export const StartSessionSchema = z.object({
  learningItemId: z.string().optional(),
});

export type StartSessionDto = z.infer<typeof StartSessionSchema>;
