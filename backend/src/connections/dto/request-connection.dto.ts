import { z } from 'zod';

export const requestConnectionSchema = z.object({
  fromProfileId: z.string().uuid(),
  toProfileId: z.string().uuid(),
});

export const requestBySlugSchema = z.object({
  fromProfileId: z.string().uuid(),
  slug: z.string().min(3).max(40),
});

export type RequestConnectionDto = z.infer<typeof requestConnectionSchema>;
export type RequestBySlugDto = z.infer<typeof requestBySlugSchema>;
