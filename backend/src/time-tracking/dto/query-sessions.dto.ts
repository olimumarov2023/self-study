import { z } from 'zod';

export const QuerySessionsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type QuerySessionsDto = z.infer<typeof QuerySessionsSchema>;
