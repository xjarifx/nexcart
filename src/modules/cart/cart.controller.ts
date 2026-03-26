import { Request, Response, NextFunction } from "express";
import { respond } from "../../lib/response.js";
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
  respond(res, { data: result.data });
};

export const addCartItem = async (req: Request, res: Response, next: NextFunction) => {
  const { productId, quantity } = addCartItemSchema.parse(req.body);
  const result = await addCartItemService(req.user!.id, productId, quantity);
  respond(res, { status: 201, message: "Item added to cart", data: result.data });
};

export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  const { quantity } = updateCartItemSchema.parse(req.body);
  const result = await updateCartItemService(req.user!.id, req.params.id, quantity);
  respond(res, { message: "Cart item updated", data: result.data });
};

export const deleteCartItem = async (req: Request, res: Response, next: NextFunction) => {
  await deleteCartItemService(req.user!.id, req.params.id);
  respond(res, { message: "Item removed from cart" });
};

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  await clearCartService(req.user!.id);
  respond(res, { message: "Cart cleared" });
};
