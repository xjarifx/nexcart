/**
 * cart/cart.validation.ts
 *
 * Zod schemas for cart request bodies.
 */

import { z } from "zod";

/** POST /api/cart/items */
export const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

/** PUT /api/cart/items/:id */
export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
});
