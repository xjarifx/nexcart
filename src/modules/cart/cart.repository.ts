/**
 * cart/cart.repository.ts
 *
 * Database access layer for the shopping cart.
 * Each user has at most one cart (unique userId constraint).
 * Cart items include product and shop data needed for stock validation.
 */

import { prisma } from "../../lib/prisma.js";

/** Shared include shape — used wherever we need the full cart with items. */
const cartInclude = {
  items: {
    include: {
      product: { include: { inventory: true, shop: true } },
    },
  },
};

/** Returns the user's cart with all items, or null if no cart exists yet. */
export const findCartByUserId = (userId: string) =>
  prisma.cart.findUnique({ where: { userId }, include: cartInclude });

/** Finds a cart item by its ID, including the parent cart (for ownership checks). */
export const findCartItemById = (id: string) =>
  prisma.cartItem.findUnique({ where: { id }, include: { cart: true } });

/** Finds a cart item by the composite unique key (cartId + productId). */
export const findCartItemByProductId = (cartId: string, productId: string) =>
  prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
  });

/**
 * Creates the cart if it doesn't exist, or returns the existing one.
 * Called before adding an item to ensure a cart always exists.
 */
export const upsertCart = (userId: string) =>
  prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: cartInclude,
  });

export const createCartItem = (
  cartId: string,
  productId: string,
  quantity: number,
) => prisma.cartItem.create({ data: { cartId, productId, quantity } });

export const updateCartItemById = (id: string, quantity: number) =>
  prisma.cartItem.update({ where: { id }, data: { quantity } });

export const deleteCartItemById = (id: string) =>
  prisma.cartItem.delete({ where: { id } });

/** Removes all items from a cart (used on clear cart and after checkout). */
export const clearCart = (cartId: string) =>
  prisma.cartItem.deleteMany({ where: { cartId } });
