import { z } from 'zod';

export const CreateResourceSchema = z.object({
  type: z.enum(['BOOK', 'VIDEO']),
  title: z.string().min(1, 'Title is required'),
  author: z.string().optional(),
  url: z.string().url().optional(),
  totalPages: z.number().int().positive().optional(),
  totalMinutes: z.number().int().positive().optional(),
  categoryId: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateResourceDto = z.infer<typeof CreateResourceSchema>;
