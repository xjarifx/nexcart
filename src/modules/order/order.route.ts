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
orderRouter.post("/", authenticate, checkout);
orderRouter.get("/", authenticate, getMyOrders);
orderRouter.get("/:id", authenticate, getMyOrderById);

// Seller order routes — mounted at /api/shops/mine/orders
export const sellerOrderRouter = Router({ mergeParams: true });
sellerOrderRouter.get("/", authenticate, getShopOrders);
sellerOrderRouter.put("/:id", authenticate, updateShopOrderStatus);

// Admin order routes — mounted at /api/admin/orders
export const adminOrderRouter = Router();
adminOrderRouter.get("/", authenticate, authorize(Role.ADMIN), getAllOrders);
adminOrderRouter.put("/:id", authenticate, authorize(Role.ADMIN), adminUpdateOrderStatus);
