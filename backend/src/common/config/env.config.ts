import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  GOOGLE_CLIENT_ID: z.string().min(1),

  MP_ACCESS_TOKEN: z.string().min(1),
  MP_WEBHOOK_SECRET: z.string().min(1),
  MP_PUBLIC_KEY: z.string().min(1),

  FTP_HOST: z.string().min(1),
  FTP_USER: z.string().min(1),
  FTP_PASSWORD: z.string().min(1),
  FTP_BASE_PATH: z.string().default('/public_html/uploads'),
  UPLOADS_PUBLIC_URL: z.string().url(),

  BACKEND_URL: z.string().default('http://localhost:3000'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  // Auto-detect BACKEND_URL from Render's RENDER_EXTERNAL_URL if not explicitly set
  if (!config.BACKEND_URL && config.RENDER_EXTERNAL_URL) {
    config.BACKEND_URL = config.RENDER_EXTERNAL_URL as string;
  }

  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const formatted = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(', ')}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${formatted}`);
  }
  return parsed.data;
}
