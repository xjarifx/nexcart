import { prisma } from "../../lib/prisma.js";

const cartInclude = {
  items: {
    include: {
      product: { include: { inventory: true, shop: true } },
    },
  },
};

export const findCartByUserId = (userId: string) =>
  prisma.cart.findUnique({ where: { userId }, include: cartInclude });

export const findCartItemById = (id: string) =>
  prisma.cartItem.findUnique({ where: { id }, include: { cart: true } });

export const findCartItemByProductId = (cartId: string, productId: string) =>
  prisma.cartItem.findUnique({ where: { cartId_productId: { cartId, productId } } });

export const upsertCart = (userId: string) =>
  prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: cartInclude,
  });

export const createCartItem = (cartId: string, productId: string, quantity: number) =>
  prisma.cartItem.create({ data: { cartId, productId, quantity } });

export const updateCartItemById = (id: string, quantity: number) =>
  prisma.cartItem.update({ where: { id }, data: { quantity } });

export const deleteCartItemById = (id: string) =>
  prisma.cartItem.delete({ where: { id } });

export const clearCart = (cartId: string) =>
  prisma.cartItem.deleteMany({ where: { cartId } });
