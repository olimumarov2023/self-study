import { z } from 'zod';

export const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().max(20).optional(),
  weightGoal: z.number().int().min(0).max(100).optional(),
});

export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;
