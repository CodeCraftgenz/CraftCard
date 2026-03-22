import { z } from 'zod';

/** Schema de validação para atualização de usuário pelo painel admin */
export const updateUserSchema = z.object({
  role: z.enum(['USER', 'SUPER_ADMIN']).optional(),
  plan: z.enum(['FREE', 'PRO', 'BUSINESS', 'ENTERPRISE']).optional(),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional(), // Ciclo de cobrança (padrão: YEARLY)
  days: z.number().int().min(1).max(3650).optional(), // Dias customizados de validade
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
