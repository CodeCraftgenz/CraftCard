import { z } from 'zod';

export const updateOrgSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  logoUrl: z.string().url('URL do logo invalida').optional().nullable(),
  primaryColor: z.string().max(30).optional(),
  secondaryColor: z.string().max(30).optional(),
  fontFamily: z.string().max(100).optional(),
  brandingActive: z.boolean().optional(),
  cardTheme: z.enum(['default', 'gradient', 'minimal', 'bold', 'ocean', 'sunset', 'forest', 'neon', 'elegant', 'cosmic']).optional(),
  linkStyle: z.enum(['rounded', 'pill', 'square', 'outline', 'ghost']).optional(),
  linkAnimation: z.enum(['none', 'scale', 'slide', 'glow']).optional(),
  backgroundType: z.enum(['theme', 'gradient']).optional(),
  backgroundGradient: z.string().max(200).optional().nullable(),
});

export type UpdateOrgDto = z.infer<typeof updateOrgSchema>;
