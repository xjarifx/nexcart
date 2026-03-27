/**
 * cart/cart.service.ts
 *
 * Business logic for the shopping cart.
 *
 * Cart is created lazily — it doesn't exist until the user adds their first item.
 * Stock is validated on every add/update to prevent adding more than available.
 * Ownership of cart items is verified before any mutation.
 */

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

/** Returns the user's cart, or an empty cart shape if none exists yet. */
export const getCartService = async (userId: string) => {
  const cart = await findCartByUserId(userId);
  return { data: cart ?? { items: [] } };
};

/**
 * Adds a product to the cart, or increments quantity if it's already there.
 * Validates:
 *  - Product exists and is active
 *  - Shop is active
 *  - Available stock (stockQuantity - reservedQuantity) covers the requested quantity
 */
export const addCartItemService = async (userId: string, productId: string, quantity: number) => {
  const product = await findProductById(productId);
  if (!product) throw new AppError("Product not found", 404);
  if (!product.isActive) throw new AppError("Product is not available", 400);
  if (product.shop.status !== "ACTIVE") throw new AppError("Product is not available", 400);

  const stock = product.inventory?.stockQuantity ?? 0;
  const reserved = product.inventory?.reservedQuantity ?? 0;
  if (stock - reserved < quantity) throw new AppError("Insufficient stock", 400);

  const cart = await upsertCart(userId); // create cart if it doesn't exist
  const existing = await findCartItemByProductId(cart.id, productId);

  if (existing) {
    // Item already in cart — add to existing quantity and re-validate stock
    const newQty = existing.quantity + quantity;
    if (stock - reserved < newQty) throw new AppError("Insufficient stock", 400);
    await updateCartItemById(existing.id, newQty);
  } else {
    await createCartItem(cart.id, productId, quantity);
  }

  const updated = await findCartByUserId(userId);
  return { data: updated };
};

/**
 * Replaces the quantity of an existing cart item.
 * Verifies the item belongs to the requesting user and that stock covers the new quantity.
 */
export const updateCartItemService = async (userId: string, itemId: string, quantity: number) => {
  const item = await findCartItemById(itemId);
  if (!item) throw new AppError("Cart item not found", 404);
  if (item.cart.userId !== userId) throw new AppError("Forbidden", 403);

  const product = await findProductById(item.productId);
  if (product) {
    const available = (product.inventory?.stockQuantity ?? 0) - (product.inventory?.reservedQuantity ?? 0);
    if (available < quantity) throw new AppError("Insufficient stock", 400);
  }

  await updateCartItemById(itemId, quantity);

  const cart = await findCartByUserId(userId);
  return { data: cart };
};

/** Removes a single item from the cart after verifying ownership. */
export const deleteCartItemService = async (userId: string, itemId: string) => {
  const item = await findCartItemById(itemId);
  if (!item) throw new AppError("Cart item not found", 404);
  if (item.cart.userId !== userId) throw new AppError("Forbidden", 403);
  await deleteCartItemById(itemId);
};

/** Removes all items from the user's cart. No-op if the cart doesn't exist. */
export const clearCartService = async (userId: string) => {
  const cart = await findCartByUserId(userId);
  if (!cart) return;
  await clearCart(cart.id);
};
