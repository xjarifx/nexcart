import { Request, Response, NextFunction } from "express";
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
  res.status(201).json(result);
};

export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getMyOrdersService(req.user!.id);
  res.json(result);
};

export const getMyOrderById = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getMyOrderByIdService(req.user!.id, req.params.id);
  res.json(result);
};

// ─── Seller ───────────────────────────────────────────────────────────────────

export const getShopOrders = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getShopOrdersService(req.user!.id);
  res.json(result);
};

export const updateShopOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { status } = updateOrderStatusSchema.parse(req.body);
  const result = await updateShopOrderStatusService(req.user!.id, req.params.id, status);
  res.json(result);
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getAllOrdersService();
  res.json(result);
};

export const adminUpdateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { status } = updateOrderStatusSchema.parse(req.body);
  const result = await adminUpdateOrderStatusService(req.params.id, status);
  res.json(result);
};
