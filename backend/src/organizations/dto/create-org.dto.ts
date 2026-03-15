import { z } from 'zod';

export const createOrgSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(150, 'Nome deve ter no máximo 150 caracteres'),
  slug: z.string().min(3, 'Slug deve ter no mínimo 3 caracteres').max(100, 'Slug deve ter no máximo 100 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minusculas, números e hifens'),
});

export type CreateOrgDto = z.infer<typeof createOrgSchema>;
