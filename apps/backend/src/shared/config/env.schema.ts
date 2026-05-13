import { z } from 'zod';

/**
 * Single source of truth for required environment variables.
 * If anything required is missing, the app refuses to boot (see main.ts).
 *
 * NOTE: auth and third-party secrets are intentionally optional in this M0
 * scaffold so the app can boot in pure-local mode. They become required once
 * the feature wiring lands (see ROADMAP M1+).
 */
export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().url(),
  DIRECT_DATABASE_URL: z.string().url().optional(),
  SHADOW_DATABASE_URL: z.string().url().optional(),

  REDIS_URL: z.string().url(),

  // Auth — required at M1; optional during M0.
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_ISSUER: z.string().url().default('https://api.mawared.local'),
  JWT_AUDIENCE_CUSTOMER: z.string().default('mawared-customer'),
  JWT_AUDIENCE_ADMIN: z.string().default('mawared-admin'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(2592000),

  // Third parties — required at M2; optional during M0.
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Signit.sa identity verification
  SIGNIT_BASE_URL: z.string().url().default('https://api.signit.sa'),
  SIGNIT_API_KEY: z.string().optional(),
  SIGNIT_WEBHOOK_SECRET: z.string().optional(),
  SIGNIT_CALLBACK_URL: z.string().url().optional(),
  VERIFICATION_TTL_DAYS: z.coerce.number().int().positive().default(365),

  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default('auto'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_BASE_URL: z.string().url().optional(),

  FCM_SERVICE_ACCOUNT_JSON: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('no-reply@mawared.local'),

  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().default('development'),

  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3001,http://localhost:3002')
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),

  FEATURE_FLAGS_DEFAULT_ENABLED: z
    .union([z.boolean(), z.string()])
    .default(false)
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true')),
  AUTO_REVIEW_ORDERS: z
    .union([z.boolean(), z.string()])
    .default(true)
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true')),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
