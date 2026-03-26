import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { createPayment, getPaymentByOrderId } from "./payment.controller.js";

const paymentRouter = Router();

paymentRouter.post("/", authenticate, createPayment);
paymentRouter.get("/:orderId", authenticate, getPaymentByOrderId);

export default paymentRouter;
