import { z } from 'zod';

export const UpdateBookSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).optional(),
});

export type UpdateBookDto = z.infer<typeof UpdateBookSchema>;
