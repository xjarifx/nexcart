/**
 * users/users.validation.ts
 *
 * Zod schemas for user profile and address request bodies.
 */

import { z } from "zod";
import { Role } from "../../generated/prisma/enums.js";

/** PUT /api/users/me — at least one field required */
export const updateMeSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().min(10).max(15).optional(),
  })
  .refine((data) => data.name !== undefined || data.phone !== undefined, {
    message: "At least one field (name or phone) must be provided",
  });

/** PUT /api/users/me/password */
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

/** POST /api/users/me/addresses  |  PUT /api/users/me/addresses/:id (used as .partial()) */
export const addressSchema = z.object({
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  isDefault: z.boolean().optional().default(false),
});

export const adminUpdateRoleSchema = z.object({
  role: z.nativeEnum(Role),
});
