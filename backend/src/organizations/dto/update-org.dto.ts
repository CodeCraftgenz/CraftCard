import { z } from 'zod';

export const updateOrgSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  logoUrl: z.string().url('URL do logo invalida').optional().nullable(),
  primaryColor: z.string().max(30).optional(),
  secondaryColor: z.string().max(30).optional(),
  fontFamily: z.string().max(100).optional(),
  brandingActive: z.boolean().optional(),
  cardTheme: z.enum(['default', 'gradient', 'minimal', 'bold', 'ocean', 'sunset', 'forest', 'neon', 'elegant', 'cosmic']).optional(),
  linkStyle: z.enum(['rounded', 'pill', 'square', 'outline', 'ghost', 'elevated', 'glassmorphism', 'neon-border']).optional(),
  linkAnimation: z.enum(['none', 'scale', 'slide', 'glow']).optional(),
  linkLayout: z.enum(['list', 'grid']).optional(),
  iconStyle: z.enum(['default', 'filled', 'outline', 'neomorph', 'glass', 'gradient', 'neon', 'shadow', 'minimal', 'circle', 'soft']).optional(),
  backgroundType: z.enum(['theme', 'gradient', 'image']).optional(),
  backgroundGradient: z.string().max(200).optional().nullable(),
  coverUrl: z.string().max(500).optional().nullable(),
  backgroundImageUrl: z.string().max(500).optional().nullable(),
});

export type UpdateOrgDto = z.infer<typeof updateOrgSchema>;
