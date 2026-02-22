import { z } from 'zod';

const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript):/i;

/** Preprocess: convert empty/whitespace-only strings to undefined so .optional() treats them as absent */
const emptyToUndefined = (val: unknown) =>
  typeof val === 'string' && val.trim() === '' ? undefined : val;

const safeUrlSchema = z.string().url().refine(
  (url) => !DANGEROUS_PROTOCOLS.test(url),
  { message: 'Protocolo nao permitido' },
);

export const socialLinkSchema = z.object({
  platform: z.enum([
    'whatsapp', 'instagram', 'linkedin', 'github', 'twitter',
    'tiktok', 'youtube', 'website', 'email', 'other',
  ]),
  label: z.string().min(1).max(100),
  url: safeUrlSchema,
  order: z.number().int().min(0).max(50),
});

export const updateProfileSchema = z.object({
  displayName: z.preprocess(emptyToUndefined, z.string().min(2).max(100).optional()),
  bio: z.preprocess(emptyToUndefined, z.string().max(500).optional().nullable()),
  buttonColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor invalida').optional(),
  slug: z.preprocess(emptyToUndefined, z
    .string()
    .min(3, 'Slug deve ter no minimo 3 caracteres')
    .max(40, 'Slug deve ter no maximo 40 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Slug so pode conter letras minusculas, numeros e hifens')
    .optional(),
  ),
  isPublished: z.boolean().optional(),
  resumeUrl: z.preprocess(emptyToUndefined, safeUrlSchema.optional().nullable()),
  resumeType: z.enum(['pdf', 'link']).optional().nullable(),
  cardTheme: z.enum(['default', 'gradient', 'minimal', 'bold']).optional(),
  socialLinks: z.array(socialLinkSchema).max(20).optional(),
}).transform((data) => {
  // Filter out incomplete social links (empty label or invalid url)
  if (data.socialLinks) {
    data.socialLinks = data.socialLinks.filter(
      (link) => link.label.trim() !== '' && link.url.trim() !== '',
    );
  }
  return data;
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type SocialLinkDto = z.infer<typeof socialLinkSchema>;
