/**
 * order/order.repository.ts
 *
 * Database access layer for orders.
 * The most critical function here is `createOrderTransaction` which wraps
 * order creation, inventory decrement, and cart clearing in a single
 * Prisma transaction to ensure atomicity.
 */

import { OrderStatus } from "../../generated/prisma/enums.js";
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
  prisma.order.findMany({ where: { userId }, include: orderInclude, orderBy: { createdAt: "desc" } });

/** Returns all orders that contain at least one item from the given shop. */
export const findOrdersByShopId = (shopId: string) =>
  prisma.order.findMany({
    where: { items: { some: { shopId } } },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });

export const findAllOrders = () =>
  prisma.order.findMany({ include: orderInclude, orderBy: { createdAt: "desc" } });

export const updateOrderStatus = (id: string, status: OrderStatus) =>
  prisma.order.update({ where: { id }, data: { status }, include: orderInclude });

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
 *  1. Create the order with all its items
 *  2. Decrement inventory for each item
 *  3. Clear the user's cart
 *
 * NOTE: This does not use SELECT FOR UPDATE, so concurrent checkouts can
 * still oversell stock. See AUDIT.md for the known race condition.
 */
export const createOrderTransaction = async (data: {
  userId: string;
  addressId: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    shopId: string;
    quantity: number;
    priceAtPurchase: number;
  }>;
  cartId: string;
  inventoryUpdates: Array<{ productId: string; stockQuantity: number }>;
}) => {
  return prisma.$transaction(async (tx: typeof prisma) => {
    // Step 1: Create the order and its line items
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
      include: { items: { include: { product: true, shop: true } }, address: true },
    });

    // Step 2: Decrement stock for each purchased product
    for (const update of data.inventoryUpdates) {
      await tx.inventory.update({
        where: { productId: update.productId },
        data: { stockQuantity: update.stockQuantity },
      });
    }

    // Step 3: Clear the cart so it's empty for the next session
    await tx.cartItem.deleteMany({ where: { cartId: data.cartId } });

    return order;
  });
};
