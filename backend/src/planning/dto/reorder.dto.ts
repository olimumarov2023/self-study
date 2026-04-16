import { z } from 'zod';

export const ReorderSchema = z.object({
  assignments: z
    .array(
      z.object({
        id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid assignment ID'),
        rank: z.number().int().min(0),
      }),
    )
    .min(1, 'At least one assignment is required'),
});

export type ReorderDto = z.infer<typeof ReorderSchema>;
