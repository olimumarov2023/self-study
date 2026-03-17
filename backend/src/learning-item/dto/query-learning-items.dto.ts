import { z } from 'zod';

export const QueryLearningItemsSchema = z.object({
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
  categoryId: z.string().cuid().optional(),
  search: z.string().max(255).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  tags: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type QueryLearningItemsDto = z.infer<typeof QueryLearningItemsSchema>;
