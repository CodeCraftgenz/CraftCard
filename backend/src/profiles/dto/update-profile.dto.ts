import { z } from 'zod';

const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript):/i;

/** Preprocess: convert empty/whitespace-only strings to undefined so .optional() treats them as absent */
const emptyToUndefined = (val: unknown) =>
  typeof val === 'string' && val.trim() === '' ? undefined : val;

const safeUrlSchema = z.string().url().refine(
  (url) => !DANGEROUS_PROTOCOLS.test(url),
  { message: 'Protocolo nao permitido' },
);

/** URL schema for social links — accepts http(s), mailto:, and tel: */
const socialUrlSchema = z.string().min(1).refine(
  (url) => /^https?:\/\/.+/i.test(url) || /^mailto:.+@.+/i.test(url) || /^tel:.+/i.test(url),
  { message: 'URL invalida' },
).refine(
  (url) => !DANGEROUS_PROTOCOLS.test(url),
  { message: 'Protocolo nao permitido' },
);

const EXPANDED_PLATFORMS = [
  'whatsapp', 'instagram', 'linkedin', 'github', 'twitter',
  'tiktok', 'youtube', 'website', 'email', 'other', 'custom',
  'header', 'pix', 'video_embed', 'music_embed', 'file', 'map', 'phone',
] as const;

export const socialLinkSchema = z.object({
  platform: z.enum(EXPANDED_PLATFORMS),
  label: z.string().min(1).max(100),
  url: z.string().max(500).default(''),
  order: z.number().int().min(0).max(50),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  linkType: z.enum(['link', 'header', 'embed', 'pix', 'file', 'map', 'phone']).optional().nullable(),
  metadata: z.string().max(2000).optional().nullable(),
}).refine(
  (link) => {
    // Headers don't need a URL
    if (link.platform === 'header') return true;
    // Pix stores key in metadata, not URL
    if (link.platform === 'pix') return true;
    // All other types need a valid URL
    if (!link.url) return false;
    return /^https?:\/\/.+/i.test(link.url) || /^mailto:.+@.+/i.test(link.url) || /^tel:.+/i.test(link.url);
  },
  { message: 'URL invalida para este tipo de link', path: ['url'] },
).refine(
  (link) => {
    if (link.startsAt && link.endsAt) return link.endsAt > link.startsAt;
    return true;
  },
  { message: 'Data de fim deve ser posterior a data de inicio', path: ['endsAt'] },
);

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
  cardTheme: z.enum(['default', 'gradient', 'minimal', 'bold', 'ocean', 'sunset', 'forest', 'neon', 'elegant', 'cosmic']).optional(),
  coverPhotoUrl: z.preprocess(emptyToUndefined, safeUrlSchema.optional().nullable()),
  availabilityStatus: z.enum(['available', 'busy', 'unavailable']).optional().nullable(),
  availabilityMessage: z.preprocess(emptyToUndefined, z.string().max(100).optional().nullable()),
  photoPositionY: z.number().int().min(0).max(100).optional(),
  coverPositionY: z.number().int().min(0).max(100).optional(),
  videoUrl: z.preprocess(emptyToUndefined, safeUrlSchema.optional().nullable()),
  leadCaptureEnabled: z.boolean().optional(),
  bookingEnabled: z.boolean().optional(),
  // Visual Customization
  fontFamily: z.preprocess(emptyToUndefined, z.string().max(50).optional().nullable()),
  fontSizeScale: z.number().min(0.8).max(1.3).optional().nullable(),
  backgroundType: z.enum(['theme', 'gradient', 'image', 'pattern']).optional().nullable(),
  backgroundGradient: z.preprocess(emptyToUndefined, z.string().max(200).optional().nullable()),
  backgroundImageUrl: z.preprocess(emptyToUndefined, safeUrlSchema.optional().nullable()),
  backgroundOverlay: z.number().min(0).max(1).optional().nullable(),
  backgroundPattern: z.preprocess(emptyToUndefined, z.string().max(30).optional().nullable()),
  linkStyle: z.enum(['rounded', 'pill', 'square', 'outline', 'ghost']).optional().nullable(),
  linkAnimation: z.enum(['none', 'scale', 'slide', 'glow']).optional().nullable(),
  // Expanded Bio
  location: z.preprocess(emptyToUndefined, z.string().max(100).optional().nullable()),
  pronouns: z.preprocess(emptyToUndefined, z.string().max(30).optional().nullable()),
  workingHours: z.preprocess(emptyToUndefined, z.string().max(100).optional().nullable()),
  tagline: z.preprocess(emptyToUndefined, z.string().max(200).optional().nullable()),
  sectionsOrder: z.preprocess(emptyToUndefined, z.string().max(500).optional().nullable()),
  socialLinks: z.array(socialLinkSchema).max(20).optional(),
}).transform((data) => {
  // Filter out incomplete social links (empty label or invalid url)
  // Headers and Pix don't need a URL — only filter other types
  if (data.socialLinks) {
    data.socialLinks = data.socialLinks.filter(
      (link) => {
        if (link.label.trim() === '') return false;
        if (link.platform === 'header' || link.platform === 'pix') return true;
        return link.url.trim() !== '';
      },
    );
  }
  return data;
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type SocialLinkDto = z.infer<typeof socialLinkSchema>;
