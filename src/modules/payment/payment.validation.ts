/**
 * payment/payment.validation.ts
 *
 * Zod schemas for payment request bodies.
 */

import { z } from "zod";

/** POST /api/payments */
export const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  paymentMethod: z.string().min(1), // e.g. "card", "paypal", "bank_transfer"
  transactionId: z.string().min(1), // external transaction reference from payment gateway
});
