import { z } from 'zod';

export const UpdateSubItemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  estimatedHours: z.number().positive().nullable().optional(),
  tags: z.array(z.string()).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type UpdateSubItemDto = z.infer<typeof UpdateSubItemSchema>;
