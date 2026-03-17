import { z } from 'zod';

export const MoveStatusSchema = z.object({
  status: z.enum([
    'TO_LEARN',
    'PLANNED',
    'IN_PROGRESS',
    'LEARNED',
    'NEEDS_REVISION',
    'ARCHIVED',
  ]),
});

export type MoveStatusDto = z.infer<typeof MoveStatusSchema>;
