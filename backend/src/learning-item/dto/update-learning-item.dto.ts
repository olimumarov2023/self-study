import { z } from 'zod';

export const UpdateLearningItemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional(),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID').nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  estimatedHours: z.number().positive().nullable().optional(),
  tags: z.array(z.string()).optional(),
  targetRole: z.string().max(255).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  status: z
    .enum([
      'TO_LEARN',
      'PLANNED',
      'IN_PROGRESS',
      'LEARNED',
      'NEEDS_REVISION',
      'ARCHIVED',
    ])
    .optional(),
});

export type UpdateLearningItemDto = z.infer<typeof UpdateLearningItemSchema>;
