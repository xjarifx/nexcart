/**
 * auth/auth.validation.ts
 *
 * Zod schemas for auth request bodies.
 * Parsed in the controller before any service logic runs.
 */

import { z } from "zod";

/** POST /api/auth/register */
export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(10).max(15),
});

/** POST /api/auth/login */
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** POST /api/auth/refresh  |  POST /api/auth/logout */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
