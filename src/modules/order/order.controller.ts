/**
 * order/order.controller.ts
 *
 * HTTP layer for order endpoints.
 * Split into three sections matching the three access contexts:
 * buyer, seller, and admin.
 */

import { Request, Response, NextFunction } from "express";
import { respond } from "../../lib/response.js";
import { parsePaginationQuery } from "../../lib/paginate.js";
import { checkoutSchema, updateOrderStatusSchema } from "./order.validation.js";
import {
  checkoutService,
  getMyOrdersService,
  getMyOrderByIdService,
  cancelMyOrderService,
  getShopOrdersService,
  updateShopOrderStatusService,
  getAllOrdersService,
  adminUpdateOrderStatusService,
} from "./order.service.js";

// ─── Buyer ────────────────────────────────────────────────────────────────────

export const checkout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { addressId } = checkoutSchema.parse(req.body);
  const result = await checkoutService(req.user!.id, addressId);
  respond(res, {
    status: 201,
    message: "Order placed successfully",
    data: result.data,
  });
};

export const getMyOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { page, limit } = parsePaginationQuery({
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
  });
  const result = await getMyOrdersService(req.user!.id, page, limit);
  respond(res, { data: result.data, meta: result.meta });
};

export const getMyOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = await getMyOrderByIdService(
    req.user!.id,
    req.params.id as string,
  );
  respond(res, { data: result.data });
};

export const cancelMyOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = await cancelMyOrderService(
    req.user!.id,
    req.params.id as string,
  );
  respond(res, { message: "Order cancelled", data: result.data });
};

// ─── Seller ───────────────────────────────────────────────────────────────────

export const getShopOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { page, limit } = parsePaginationQuery({
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
  });
  const result = await getShopOrdersService(req.user!.id, page, limit);
  respond(res, { data: result.data, meta: result.meta });
};

export const updateShopOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { status } = updateOrderStatusSchema.parse(req.body);
  const result = await updateShopOrderStatusService(
    req.user!.id,
    req.params.id as string,
    status,
  );
  respond(res, { message: "Order status updated", data: result.data });
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { page, limit } = parsePaginationQuery({
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
  });
  const result = await getAllOrdersService(page, limit);
  respond(res, { data: result.data, meta: result.meta });
};

export const adminUpdateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { status } = updateOrderStatusSchema.parse(req.body);
  const result = await adminUpdateOrderStatusService(
    req.params.id as string,
    status,
  );
  respond(res, { message: "Order status updated", data: result.data });
};
