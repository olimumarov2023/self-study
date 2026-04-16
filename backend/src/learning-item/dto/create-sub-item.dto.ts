import { z } from 'zod';

export const CreateSubItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  difficulty: z.number().int().min(1).max(5).default(3),
  estimatedHours: z.number().positive().optional(),
  tags: z.array(z.string()).default([]),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateSubItemDto = z.infer<typeof CreateSubItemSchema>;
