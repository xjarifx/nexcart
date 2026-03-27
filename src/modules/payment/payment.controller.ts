/**
 * payment/payment.controller.ts
 *
 * HTTP layer for payment endpoints.
 * All routes require authentication (enforced in the route file).
 */

import { Request, Response, NextFunction } from "express";
import { respond } from "../../lib/response.js";
import { createPaymentSchema } from "./payment.validation.js";
import { createPaymentService, getPaymentByOrderIdService } from "./payment.service.js";

export const createPayment = async (req: Request, res: Response, next: NextFunction) => {
  const body = createPaymentSchema.parse(req.body);
  const result = await createPaymentService(req.user!.id, body);
  respond(res, { status: 201, message: "Payment recorded", data: result.data });
};

export const getPaymentByOrderId = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getPaymentByOrderIdService(req.user!.id, req.params.orderId);
  respond(res, { data: result.data });
};
