import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  JWT_SECRET: z
    .string()
    .min(32)
    .default("development-only-secret-change-me-now"),
  DATABASE_URL: z.string().optional(),
  PGLITE_DATA_DIR: z.string().default("memory://"),
  DRY_RUN_NOTIFICATIONS: z.enum(["true", "false"]).default("true"),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(overrides: Record<string, unknown> = {}): AppConfig {
  return envSchema.parse({ ...process.env, ...overrides });
}
