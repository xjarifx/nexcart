/**
 * payment/payment.repository.ts
 *
 * Database access layer for payments.
 * Each order can have at most one payment record (unique orderId constraint).
 */

import { PaymentStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";

/** Returns the payment for an order, or null if not yet recorded. */
export const findPaymentByOrderId = (orderId: string) =>
  prisma.payment.findUnique({ where: { orderId } });

/** Creates a payment record. Status is set by the service layer. */
export const createPayment = (data: {
  orderId: string;
  paymentMethod: string;
  transactionId: string;
  status: PaymentStatus;
}) => prisma.payment.create({ data });
