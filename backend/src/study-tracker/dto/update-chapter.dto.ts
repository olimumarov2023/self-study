import { z } from 'zod';

export const UpdateChapterSchema = z.object({
  title: z.string().min(1).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type UpdateChapterDto = z.infer<typeof UpdateChapterSchema>;
