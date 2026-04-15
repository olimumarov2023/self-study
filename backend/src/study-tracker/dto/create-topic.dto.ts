import { z } from 'zod';

export const CreateTopicSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  notes: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateTopicDto = z.infer<typeof CreateTopicSchema>;
