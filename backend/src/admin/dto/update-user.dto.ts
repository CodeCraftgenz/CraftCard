import { z } from 'zod';

export const updateUserSchema = z.object({
  role: z.enum(['USER', 'SUPER_ADMIN']).optional(),
  plan: z.enum(['FREE', 'PRO', 'BUSINESS', 'ENTERPRISE']).optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
