import { Request, Response, NextFunction } from "express";
import { createPaymentSchema } from "./payment.validation.js";
import { createPaymentService, getPaymentByOrderIdService } from "./payment.service.js";

export const createPayment = async (req: Request, res: Response, next: NextFunction) => {
  const body = createPaymentSchema.parse(req.body);
  const result = await createPaymentService(req.user!.id, body);
  res.status(201).json(result);
};

export const getPaymentByOrderId = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getPaymentByOrderIdService(req.user!.id, req.params.orderId);
  res.json(result);
};
