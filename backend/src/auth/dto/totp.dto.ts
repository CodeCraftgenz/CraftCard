import { z } from 'zod';

export const verifyTotpSchema = z.object({
  code: z.string().length(6, 'Código TOTP deve ter 6 digitos').regex(/^\d+$/, 'Código deve conter apenas números'),
});

export const loginTotpSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(8), // 6 digits TOTP or 8 char backup code
});

export const disableTotpSchema = z.object({
  code: z.string().length(6, 'Código TOTP deve ter 6 digitos').regex(/^\d+$/, 'Código deve conter apenas números'),
});

export type VerifyTotpDto = z.infer<typeof verifyTotpSchema>;
export type LoginTotpDto = z.infer<typeof loginTotpSchema>;
export type DisableTotpDto = z.infer<typeof disableTotpSchema>;
