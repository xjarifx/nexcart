import { AppError } from "../../types/errors.js";
import { findProductById } from "../product/product.repository.js";
import {
  findCartByUserId,
  findCartItemById,
  findCartItemByProductId,
  upsertCart,
  createCartItem,
  updateCartItemById,
  deleteCartItemById,
  clearCart,
} from "./cart.repository.js";

export const getCartService = async (userId: string) => {
  const cart = await findCartByUserId(userId);
  return { data: cart ?? { items: [] } };
};

export const addCartItemService = async (userId: string, productId: string, quantity: number) => {
  const product = await findProductById(productId);
  if (!product) throw new AppError("Product not found", 404);
  if (!product.isActive) throw new AppError("Product is not available", 400);
  if (product.shop.status !== "ACTIVE") throw new AppError("Product is not available", 400);

  const stock = product.inventory?.stockQuantity ?? 0;
  const reserved = product.inventory?.reservedQuantity ?? 0;
  if (stock - reserved < quantity) throw new AppError("Insufficient stock", 400);

  const cart = await upsertCart(userId);
  const existing = await findCartItemByProductId(cart.id, productId);

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (stock - reserved < newQty) throw new AppError("Insufficient stock", 400);
    await updateCartItemById(existing.id, newQty);
  } else {
    await createCartItem(cart.id, productId, quantity);
  }

  const updated = await findCartByUserId(userId);
  return { data: updated };
};

export const updateCartItemService = async (userId: string, itemId: string, quantity: number) => {
  const item = await findCartItemById(itemId);
  if (!item) throw new AppError("Cart item not found", 404);
  if (item.cart.userId !== userId) throw new AppError("Forbidden", 403);

  // validate stock for new quantity
  const product = await findProductById(item.productId);
  if (product) {
    const available = (product.inventory?.stockQuantity ?? 0) - (product.inventory?.reservedQuantity ?? 0);
    if (available < quantity) throw new AppError("Insufficient stock", 400);
  }

  await updateCartItemById(itemId, quantity);

  const cart = await findCartByUserId(userId);
  return { data: cart };
};

export const deleteCartItemService = async (userId: string, itemId: string) => {
  const item = await findCartItemById(itemId);
  if (!item) throw new AppError("Cart item not found", 404);
  if (item.cart.userId !== userId) throw new AppError("Forbidden", 403);
  await deleteCartItemById(itemId);
};

export const clearCartService = async (userId: string) => {
  const cart = await findCartByUserId(userId);
  if (!cart) return;
  await clearCart(cart.id);
};
