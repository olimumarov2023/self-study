import { z } from 'zod';

export const CreateBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).optional(),
});

export type CreateBookDto = z.infer<typeof CreateBookSchema>;
