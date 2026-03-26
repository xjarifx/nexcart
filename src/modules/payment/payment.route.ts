import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { createPayment, getPaymentByOrderId } from "./payment.controller.js";

const paymentRouter = Router();

/**
 * @openapi
 * /api/payments:
 *   post:
 *     tags: [Payments]
 *     summary: Record a payment for an order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, paymentMethod, transactionId]
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               paymentMethod:
 *                 type: string
 *                 example: credit_card
 *               transactionId:
 *                 type: string
 *                 example: txn_abc123
 *     responses:
 *       201:
 *         description: Payment recorded
 *       403:
 *         description: Order does not belong to you
 *       404:
 *         description: Order not found
 *       409:
 *         description: Payment already recorded for this order
 */
paymentRouter.post("/", authenticate, createPayment);

/**
 * @openapi
 * /api/payments/{orderId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment for an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment details
 *       403:
 *         description: Order does not belong to you
 *       404:
 *         description: Order or payment not found
 */
paymentRouter.get("/:orderId", authenticate, getPaymentByOrderId);

export default paymentRouter;
