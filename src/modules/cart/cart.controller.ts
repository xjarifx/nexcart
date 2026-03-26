import { Request, Response, NextFunction } from "express";
import { addCartItemSchema, updateCartItemSchema } from "./cart.validation.js";
import {
  getCartService,
  addCartItemService,
  updateCartItemService,
  deleteCartItemService,
  clearCartService,
} from "./cart.service.js";

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getCartService(req.user!.id);
  res.json(result);
};

export const addCartItem = async (req: Request, res: Response, next: NextFunction) => {
  const { productId, quantity } = addCartItemSchema.parse(req.body);
  const result = await addCartItemService(req.user!.id, productId, quantity);
  res.status(201).json(result);
};

export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  const { quantity } = updateCartItemSchema.parse(req.body);
  const result = await updateCartItemService(req.user!.id, req.params.id, quantity);
  res.json(result);
};

export const deleteCartItem = async (req: Request, res: Response, next: NextFunction) => {
  await deleteCartItemService(req.user!.id, req.params.id);
  res.status(204).send();
};

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  await clearCartService(req.user!.id);
  res.status(204).send();
};
