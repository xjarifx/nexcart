/**
 * order/order.repository.ts
 *
 * Database access layer for orders.
 * The most critical function here is `createOrderTransaction` which wraps
 * order creation, inventory decrement, and cart clearing in a single
 * Prisma transaction to ensure atomicity.
 */

import { OrderStatus } from "../../generated/prisma/enums.js";
import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../types/errors.js";
import { prisma } from "../../lib/prisma.js";

/** Shared include shape for order queries — includes items, address, and payment. */
const orderInclude = {
  items: { include: { product: true, shop: true } },
  address: true,
  payment: true,
};

export const findOrderById = (id: string) =>
  prisma.order.findUnique({ where: { id }, include: orderInclude });

/** Returns all orders for a user, newest first. */
export const findOrdersByUserId = (userId: string) =>
  prisma.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });

/** Returns all orders that contain at least one item from the given shop. */
export const findOrdersByShopId = (shopId: string) =>
  prisma.order.findMany({
    where: { items: { some: { shopId } } },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });

export const findAllOrders = () =>
  prisma.order.findMany({
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });

export const updateOrderStatus = async (id: string, status: OrderStatus) => {
  if (status !== OrderStatus.CANCELLED) {
    return prisma.order.update({
      where: { id },
      data: { status },
      include: orderInclude,
    });
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) throw new AppError("Order not found", 404);
    if (order.status === OrderStatus.CANCELLED)
      throw new AppError("Order is already cancelled", 400);

    for (const item of order.items) {
      const { count } = await tx.inventory.updateMany({
        where: { productId: item.productId },
        data: { stockQuantity: { increment: item.quantity } },
      });

      if (count !== 1) {
        throw new AppError(
          `Inventory not found for product ${item.productId}`,
          409,
        );
      }
    }

    return tx.order.update({
      where: { id },
      data: { status },
      include: orderInclude,
    });
  });
};

/** Fetches the user's cart with full product and inventory data needed for checkout validation. */
export const findCartWithItems = (userId: string) =>
  prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: { include: { inventory: true, shop: true } },
        },
      },
    },
  });

/** Verifies the address belongs to the user before using it for an order. */
export const findAddressByIdAndUserId = (id: string, userId: string) =>
  prisma.address.findFirst({ where: { id, userId } });

/**
 * Atomic checkout transaction — all three steps succeed or all roll back:
 *  1. Decrement inventory for each item with a conditional update
 *  2. Create the order with all its items
 *  3. Clear the user's cart
 */
export const createOrderTransaction = async (data: {
  userId: string;
  addressId: string;
  totalAmount: Prisma.Decimal;
  items: Array<{
    productId: string;
    shopId: string;
    productName: string;
    quantity: number;
    priceAtPurchase: number;
  }>;
  cartId: string;
}) => {
  return prisma.$transaction(async (tx) => {
    // Step 1: Decrement stock only if enough inventory is still available.
    for (const item of data.items) {
      const rowsAffected = await tx.$executeRaw(
        Prisma.sql`UPDATE "Inventory"
                   SET "stockQuantity" = "stockQuantity" - ${item.quantity}
                   WHERE "productId" = ${item.productId}
                     AND "stockQuantity" >= ${item.quantity}`,
      );

      if (rowsAffected !== 1) {
        throw new AppError(`Insufficient stock for "${item.productName}"`, 409);
      }
    }

    // Step 2: Create the order and its line items
    const order = await tx.order.create({
      data: {
        userId: data.userId,
        addressId: data.addressId,
        totalAmount: data.totalAmount,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            shopId: item.shopId,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase,
          })),
        },
      },
      include: {
        items: { include: { product: true, shop: true } },
        address: true,
      },
    });

    // Step 3: Clear the cart so it's empty for the next session
    await tx.cartItem.deleteMany({ where: { cartId: data.cartId } });

    return order;
  });
};
