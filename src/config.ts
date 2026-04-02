/**
 * config.ts
 *
 * Validates all required environment variables at startup using Zod.
 * If any variable is missing or invalid, the process exits immediately
 * with a clear error message — preventing silent misconfigurations.
 *
 * Import this module first in index.ts before anything else.
 * Use the exported `config` object instead of `process.env` throughout the app.
 */

import "dotenv/config";
import { z } from "zod";

const csvUrlListSchema = z
  .string()
  .min(1, "FRONTEND_URL is required")
  .transform((value) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  )
  .refine((urls) => urls.length > 0, "At least one FRONTEND_URL is required")
  .refine(
    (urls) => urls.every((url) => z.string().url().safeParse(url).success),
    "FRONTEND_URL must contain valid URL(s)",
  );

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  FRONTEND_URL: csvUrlListSchema,
  // Minimum 32 chars to ensure sufficient entropy for JWT signing
  ACCESS_TOKEN_SECRET: z
    .string()
    .min(32, "ACCESS_TOKEN_SECRET must be at least 32 characters"),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters"),
  IMAGEKIT_PUBLIC_KEY: z.string().min(1, "IMAGEKIT_PUBLIC_KEY is required"),
  IMAGEKIT_PRIVATE_KEY: z.string().min(1, "IMAGEKIT_PRIVATE_KEY is required"),
  IMAGEKIT_URL_ENDPOINT: z
    .string()
    .url("IMAGEKIT_URL_ENDPOINT must be a valid URL"),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  parsed.error.issues.forEach((issue) => {
    console.error(`   ${issue.path.join(".")}: ${issue.message}`);
  });
  process.exit(1);
}

export const config = parsed.data;
