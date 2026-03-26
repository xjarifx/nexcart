import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { Role } from "../../generated/prisma/enums.js";
import {
  checkout,
  getMyOrders,
  getMyOrderById,
  getShopOrders,
  updateShopOrderStatus,
  getAllOrders,
  adminUpdateOrderStatus,
} from "./order.controller.js";

// Buyer order routes — mounted at /api/orders
export const orderRouter = Router();

/**
 * @openapi
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Checkout — create an order from cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [addressId]
 *             properties:
 *               addressId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Order created, cart cleared, inventory decremented
 *       400:
 *         description: Cart empty, product unavailable, or address not found
 *       409:
 *         description: Insufficient stock for one or more items
 */
orderRouter.post("/", authenticate, checkout);

/**
 * @openapi
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get own order history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
orderRouter.get("/", authenticate, getMyOrders);

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get a specific order by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order details
 *       403:
 *         description: Order does not belong to you
 *       404:
 *         description: Order not found
 */
orderRouter.get("/:id", authenticate, getMyOrderById);

// Seller order routes — mounted at /api/shops/mine/orders
export const sellerOrderRouter = Router({ mergeParams: true });

/**
 * @openapi
 * /api/shops/mine/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get orders containing products from own shop
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 *       404:
 *         description: No shop found for this user
 */
sellerOrderRouter.get("/", authenticate, getShopOrders);

/**
 * @openapi
 * /api/shops/mine/orders/{id}:
 *   put:
 *     tags: [Orders]
 *     summary: Update order status (seller — PENDING→CONFIRMED or CONFIRMED→SHIPPED only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [CONFIRMED, SHIPPED]
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid status transition
 *       403:
 *         description: Order does not belong to your shop
 *       404:
 *         description: Order not found
 */
sellerOrderRouter.put("/:id", authenticate, updateShopOrderStatus);

// Admin order routes — mounted at /api/admin/orders
export const adminOrderRouter = Router();

/**
 * @openapi
 * /api/admin/orders:
 *   get:
 *     tags: [Admin]
 *     summary: Get all orders (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all orders
 */
adminOrderRouter.get("/", authenticate, authorize(Role.ADMIN), getAllOrders);

/**
 * @openapi
 * /api/admin/orders/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update any order status (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid status transition
 *       404:
 *         description: Order not found
 */
adminOrderRouter.put("/:id", authenticate, authorize(Role.ADMIN), adminUpdateOrderStatus);
