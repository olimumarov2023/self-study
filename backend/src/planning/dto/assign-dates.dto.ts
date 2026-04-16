import { z } from 'zod';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const AssignDatesSchema = z.object({
  learningItemId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid learning item ID'),
  dates: z.array(z.string().regex(datePattern, 'Date must be YYYY-MM-DD')),
});

export type AssignDatesDto = z.infer<typeof AssignDatesSchema>;
