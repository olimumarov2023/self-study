import { z } from 'zod';

export const RecordReviewSchema = z.object({
  learningItemId: z.string().min(1),
  quality: z.number().int().min(0).max(5),
});

export type RecordReviewDto = z.infer<typeof RecordReviewSchema>;
