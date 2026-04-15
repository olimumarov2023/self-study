import { z } from 'zod';

export const UpdateTopicSchema = z.object({
  title: z.string().min(1).optional(),
  notes: z.string().optional(),
  learned: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type UpdateTopicDto = z.infer<typeof UpdateTopicSchema>;
