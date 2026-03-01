import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalido'),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token obrigatorio'),
    password: z
      .string()
      .min(8, 'Senha deve ter no minimo 8 caracteres')
      .regex(/[A-Z]/, 'Senha deve conter pelo menos 1 letra maiuscula')
      .regex(/[0-9]/, 'Senha deve conter pelo menos 1 numero'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Senhas nao conferem',
    path: ['confirmPassword'],
  });

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
