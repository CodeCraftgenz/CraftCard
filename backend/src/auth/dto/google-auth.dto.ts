import { z } from 'zod';

export const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

export type GoogleAuthDto = z.infer<typeof googleAuthSchema>;
