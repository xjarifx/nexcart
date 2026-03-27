/**
 * payment/payment.service.ts
 *
 * Business logic for payment recording.
 *
 * NOTE: This is a manual payment recording system — there is no real payment
 * gateway integration yet. The client is expected to complete payment externally
 * and then call POST /api/payments with the transaction reference.
 * Payment is always recorded as COMPLETED. See AUDIT.md for the full gap.
 */

import { AppError } from "../../types/errors.js";
import { PaymentStatus } from "../../generated/prisma/enums.js";
import { findOrderById } from "../order/order.repository.js";
import { findPaymentByOrderId, createPayment } from "./payment.repository.js";

/**
 * Records a payment for an order.
 * - Verifies the order belongs to the requesting user
 * - Prevents duplicate payments (one payment per order)
 */
export const createPaymentService = async (
  userId: string,
  data: { orderId: string; paymentMethod: string; transactionId: string },
) => {
  const order = await findOrderById(data.orderId);
  if (!order) throw new AppError("Order not found", 404);
  if (order.userId !== userId) throw new AppError("Forbidden", 403);

  const existing = await findPaymentByOrderId(data.orderId);
  if (existing) throw new AppError("Payment already recorded for this order", 409);

  // TODO: integrate a real payment gateway (e.g. Stripe) before going to production
  const payment = await createPayment({ ...data, status: PaymentStatus.COMPLETED });
  return { data: payment };
};

/** Returns the payment for an order after verifying the order belongs to the user. */
export const getPaymentByOrderIdService = async (userId: string, orderId: string) => {
  const order = await findOrderById(orderId);
  if (!order) throw new AppError("Order not found", 404);
  if (order.userId !== userId) throw new AppError("Forbidden", 403);

  const payment = await findPaymentByOrderId(orderId);
  if (!payment) throw new AppError("Payment not found", 404);
  return { data: payment };
};
