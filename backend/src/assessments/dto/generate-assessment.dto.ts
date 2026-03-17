import { z } from 'zod';
import { AssessmentMode } from '@prisma/client';

export const GenerateAssessmentSchema = z.object({
  learningItemId: z.string().min(1, 'learningItemId is required'),
  mode: z.nativeEnum(AssessmentMode),
  difficulty: z.number().int().min(1).max(5).default(3),
  questionCount: z.number().int().min(1).max(20).default(5),
  promptComment: z.string().max(500).optional(),
});

export type GenerateAssessmentDto = z.infer<typeof GenerateAssessmentSchema>;
