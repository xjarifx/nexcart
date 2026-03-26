import { z } from "zod";
import { OrderStatus } from "../../generated/prisma/enums.js";

export const checkoutSchema = z.object({
  addressId: z.string().uuid(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});
