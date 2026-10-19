import { config as dotenv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from '@blueprint/shared';
dotenv({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });
export const CONFIG = Symbol('CONFIG');
const origins = z
  .string()
  .default('')
  .transform((s) =>
    s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  );
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    HOST: z.string().default('127.0.0.1'),
    DATABASE_URL: z
      .string()
      .min(1)
      .refine((s) => /^postgres(?:ql)?:\/\//.test(s), 'A PostgreSQL connection URL is required.'),
    OWNER_TOKEN: z.string().min(32),
    AGENT_TOKEN: z.string().min(32),
    CORS_ORIGINS: origins,
    PREVIEW_ORIGINS: origins,
    SWAGGER_ENABLED: z
      .enum(['true', 'false'])
      .default('true')
      .transform((s) => s === 'true'),
  })
  .superRefine((v, ctx) => {
    if (v.OWNER_TOKEN === v.AGENT_TOKEN)
      ctx.addIssue({
        code: 'custom',
        path: ['AGENT_TOKEN'],
        message: 'Owner and agent tokens must differ.',
      });
    for (const key of ['OWNER_TOKEN', 'AGENT_TOKEN', 'DATABASE_URL'] as const)
      if (v[key].includes('REPLACE_'))
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: 'Run npm run setup or provide real credentials.',
        });
    for (const value of v.PREVIEW_ORIGINS) {
      try {
        const u = new URL(value);
        if (u.protocol !== 'https:' || u.origin !== value) throw new Error();
      } catch {
        ctx.addIssue({
          code: 'custom',
          path: ['PREVIEW_ORIGINS'],
          message: 'Use exact HTTPS origins, without a trailing slash.',
        });
      }
    }
    for (const value of v.CORS_ORIGINS) {
      try {
        const u = new URL(value);
        if (
          u.origin !== value ||
          !['http:', 'https:'].includes(u.protocol) ||
          (v.NODE_ENV === 'production' && u.protocol !== 'https:')
        )
          throw new Error();
      } catch {
        ctx.addIssue({
          code: 'custom',
          path: ['CORS_ORIGINS'],
          message: 'Use exact origins; HTTPS is required in production.',
        });
      }
    }
  });
export type Configuration = z.infer<typeof envSchema>;
export function readConfig(env: Record<string, string | undefined> = process.env): Configuration {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success)
    throw new Error(
      `Invalid configuration: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  return parsed.data;
}
