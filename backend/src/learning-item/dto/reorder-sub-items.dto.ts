import { z } from 'zod';

export const ReorderSubItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      sortOrder: z.number().int().min(0),
    }),
  ).min(1),
});

export type ReorderSubItemsDto = z.infer<typeof ReorderSubItemsSchema>;
