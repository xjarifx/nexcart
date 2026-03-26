import { AppError } from "../../types/errors.js";
import { PaymentStatus } from "../../generated/prisma/enums.js";
import { findOrderById } from "../order/order.repository.js";
import { findPaymentByOrderId, createPayment } from "./payment.repository.js";

export const createPaymentService = async (
  userId: string,
  data: { orderId: string; paymentMethod: string; transactionId: string },
) => {
  const order = await findOrderById(data.orderId);
  if (!order) throw new AppError("Order not found", 404);
  if (order.userId !== userId) throw new AppError("Forbidden", 403);

  const existing = await findPaymentByOrderId(data.orderId);
  if (existing) throw new AppError("Payment already recorded for this order", 409);

  const payment = await createPayment({ ...data, status: PaymentStatus.COMPLETED });
  return { data: payment };
};

export const getPaymentByOrderIdService = async (userId: string, orderId: string) => {
  const order = await findOrderById(orderId);
  if (!order) throw new AppError("Order not found", 404);
  if (order.userId !== userId) throw new AppError("Forbidden", 403);

  const payment = await findPaymentByOrderId(orderId);
  if (!payment) throw new AppError("Payment not found", 404);
  return { data: payment };
};
