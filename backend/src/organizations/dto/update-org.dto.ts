import { z } from 'zod';

export const updateOrgSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  logoUrl: z.string().url('URL do logo invalida').optional().nullable(),
  primaryColor: z.string().max(30).optional(),
  secondaryColor: z.string().max(30).optional(),
  fontFamily: z.string().max(100).optional(),
  brandingActive: z.boolean().optional(),
});

export type UpdateOrgDto = z.infer<typeof updateOrgSchema>;
