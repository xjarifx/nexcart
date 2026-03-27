/**
 * order/order.controller.ts
 *
 * HTTP layer for order endpoints.
 * Split into three sections matching the three access contexts:
 * buyer, seller, and admin.
 */

import { Request, Response, NextFunction } from "express";
import { respond } from "../../lib/response.js";
import { checkoutSchema, updateOrderStatusSchema } from "./order.validation.js";
import {
  checkoutService,
  getMyOrdersService,
  getMyOrderByIdService,
  getShopOrdersService,
  updateShopOrderStatusService,
  getAllOrdersService,
  adminUpdateOrderStatusService,
} from "./order.service.js";

// ─── Buyer ────────────────────────────────────────────────────────────────────

export const checkout = async (req: Request, res: Response, next: NextFunction) => {
  const { addressId } = checkoutSchema.parse(req.body);
  const result = await checkoutService(req.user!.id, addressId);
  respond(res, { status: 201, message: "Order placed successfully", data: result.data });
};

export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getMyOrdersService(req.user!.id);
  respond(res, { data: result.data });
};

export const getMyOrderById = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getMyOrderByIdService(req.user!.id, req.params.id as string);
  respond(res, { data: result.data });
};

// ─── Seller ───────────────────────────────────────────────────────────────────

export const getShopOrders = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getShopOrdersService(req.user!.id);
  respond(res, { data: result.data });
};

export const updateShopOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { status } = updateOrderStatusSchema.parse(req.body);
  const result = await updateShopOrderStatusService(req.user!.id, req.params.id as string, status);
  respond(res, { message: "Order status updated", data: result.data });
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getAllOrdersService();
  respond(res, { data: result.data });
};

export const adminUpdateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { status } = updateOrderStatusSchema.parse(req.body);
  const result = await adminUpdateOrderStatusService(req.params.id as string, status);
  respond(res, { message: "Order status updated", data: result.data });
};
