import { z } from 'zod';

const envSchema = z.object({
	DATABASE_URL: z.string().url().optional(),
	REDIS_URL: z.string().optional(),
	R2_ACCESS_KEY_ID: z.string().optional(),
	R2_SECRET_ACCESS_KEY: z.string().optional(),
	R2_BUCKET: z.string().optional(),
	R2_ACCOUNT_ID: z.string().optional(),
	OPENAI_API_KEY: z.string().optional(),
	ELEVENLABS_API_KEY: z.string().optional(),
	STRIPE_SECRET_KEY: z.string().optional(),
	STRIPE_WEBHOOK_SECRET: z.string().optional(),
	NEXTAUTH_SECRET: z.string().optional(),
	NEXTAUTH_URL: z.string().optional(),
	SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);