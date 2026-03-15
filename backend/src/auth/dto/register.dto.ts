import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email('Email inválido'),
    name: z.string().min(2, 'Nome muito curto').max(100),
    password: z
      .string()
      .min(8, 'Senha deve ter no mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Senha deve conter pelo menos 1 letra maiuscula')
      .regex(/[0-9]/, 'Senha deve conter pelo menos 1 número'),
    confirmPassword: z.string(),
    inviteToken: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Senhasnão conferem',
    path: ['confirmPassword'],
  });

export type RegisterDto = z.infer<typeof registerSchema>;
