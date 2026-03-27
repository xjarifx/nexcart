/**
 * shop/shop.validation.ts
 *
 * Zod schemas for shop request bodies.
 */

import { z } from "zod";

/** POST /api/shops */
export const createShopSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10),
});

/** PUT /api/shops/mine — at least one field required */
export const updateShopSchema = createShopSchema.partial().refine(
  (d) => d.name !== undefined || d.description !== undefined,
  { message: "At least one field must be provided" },
);
