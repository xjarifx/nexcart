/**
 * order/order.validation.ts
 *
 * Zod schemas for order request bodies.
 */

import { z } from "zod";
import { OrderStatus } from "../../generated/prisma/enums.js";

/** POST /api/orders/checkout */
export const checkoutSchema = z.object({
  addressId: z.string().uuid(), // must belong to the authenticated user
});

/** PUT /api/shops/mine/orders/:id/status  |  PUT /api/admin/orders/:id/status */
export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus), // validated against the enum; transition rules enforced in service
});
