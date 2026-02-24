import { z } from 'zod';

export const updateMemberRoleSchema = z.object({
  role: z.enum(['MEMBER', 'ADMIN', 'OWNER']),
});

export type UpdateMemberRoleDto = z.infer<typeof updateMemberRoleSchema>;
