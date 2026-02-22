import { z } from 'zod';

export const createTestimonialSchema = z.object({
  authorName: z.string().min(2, 'Nome deve ter no minimo 2 caracteres').max(100),
  authorRole: z.string().max(100).optional().nullable(),
  text: z.string().min(10, 'Depoimento deve ter no minimo 10 caracteres').max(500, 'Depoimento deve ter no maximo 500 caracteres'),
});

export type CreateTestimonialDto = z.infer<typeof createTestimonialSchema>;
