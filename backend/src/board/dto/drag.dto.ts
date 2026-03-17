import { z } from 'zod';

export const DragSchema = z.object({
  learningItemId: z.string().min(1),
  newStatus: z.enum([
    'TO_LEARN',
    'PLANNED',
    'IN_PROGRESS',
    'LEARNED',
    'NEEDS_REVISION',
  ]),
  newRank: z.number().int().min(0).optional(),
});

export type DragDto = z.infer<typeof DragSchema>;
