import { z } from 'zod';

export const CreateChapterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateChapterDto = z.infer<typeof CreateChapterSchema>;
