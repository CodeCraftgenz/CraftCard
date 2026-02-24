import { z } from 'zod';

export const inviteSchema = z.object({
  email: z.string().email('Email invalido'),
  role: z.enum(['MEMBER', 'ADMIN']).default('MEMBER'),
});

export type InviteDto = z.infer<typeof inviteSchema>;
