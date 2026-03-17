import { z } from 'zod';

export const UpdateResourceSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().optional(),
  url: z.string().url().optional(),
  totalPages: z.number().int().positive().optional(),
  currentPage: z.number().int().min(0).optional(),
  totalMinutes: z.number().int().positive().optional(),
  watchedMinutes: z.number().int().min(0).optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).optional(),
  categoryId: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export type UpdateResourceDto = z.infer<typeof UpdateResourceSchema>;
