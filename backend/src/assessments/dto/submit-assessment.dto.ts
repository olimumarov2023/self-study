import { z } from 'zod';

export const SubmitAssessmentSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
});

export type SubmitAssessmentDto = z.infer<typeof SubmitAssessmentSchema>;
