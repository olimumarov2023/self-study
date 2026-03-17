import { z } from 'zod';

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: z.string().max(20).optional(),
  weightGoal: z.number().int().min(0).max(100).optional(),
});

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;
