import { z } from 'zod';

export const LoginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export type LoginDto = z.infer<typeof LoginSchema>;
