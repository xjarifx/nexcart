import { z } from "zod";

export const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  paymentMethod: z.string().min(1),
  transactionId: z.string().min(1),
});
