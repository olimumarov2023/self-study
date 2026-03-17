import { z } from 'zod';
import { SkillStatus } from '@prisma/client';

export const UpdateSkillSchema = z.object({
  status: z.nativeEnum(SkillStatus),
});

export type UpdateSkillDto = z.infer<typeof UpdateSkillSchema>;
