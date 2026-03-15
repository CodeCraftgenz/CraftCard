import { z } from 'zod';

export const requestConnectionSchema = z.object({
  fromProfileId: z.string().uuid(),
  toProfileId: z.string().uuid(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  locationLabel: z.string().max(200).optional(),
  eventId: z.string().uuid().optional(),
});

export const requestBySlugSchema = z.object({
  fromProfileId: z.string().uuid(),
  slug: z.string().min(3).max(40),
});

export type RequestConnectionDto = z.infer<typeof requestConnectionSchema>;
export type RequestBySlugDto = z.infer<typeof requestBySlugSchema>;
