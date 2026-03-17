import { z } from 'zod';

export const CreateLearningItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional(),
  categoryId: z.string().cuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  difficulty: z.number().int().min(1).max(5).default(3),
  estimatedHours: z.number().positive().optional(),
  tags: z.array(z.string()).default([]),
  targetRole: z.string().max(255).optional(),
  dueDate: z.coerce.date().optional(),
  status: z
    .enum([
      'TO_LEARN',
      'PLANNED',
      'IN_PROGRESS',
      'LEARNED',
      'NEEDS_REVISION',
      'ARCHIVED',
    ])
    .default('TO_LEARN'),
});

export type CreateLearningItemDto = z.infer<typeof CreateLearningItemSchema>;
