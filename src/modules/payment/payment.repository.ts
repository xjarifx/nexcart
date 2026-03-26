import { PaymentStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";

export const findPaymentByOrderId = (orderId: string) =>
  prisma.payment.findUnique({ where: { orderId } });

export const createPayment = (data: {
  orderId: string;
  paymentMethod: string;
  transactionId: string;
  status: PaymentStatus;
}) => prisma.payment.create({ data });
