/**
 * order/order.service.ts
 *
 * Business logic for order management.
 *
 * Three access contexts:
 *  - Buyer   : checkout, view own orders
 *  - Seller  : view orders containing their products, advance status (PENDING→CONFIRMED→SHIPPED)
 *  - Admin   : view all orders, advance or cancel any order
 *
 * Order status flow:
 *   PENDING → CONFIRMED → SHIPPED → DELIVERED   (forward only)
 *   Any non-DELIVERED status → CANCELLED         (admin only)
 */

import { AppError } from "../../types/errors.js";
import { OrderStatus, ShopStatus } from "../../generated/prisma/enums.js";
import { findShopByOwnerId } from "../shop/shop.repository.js";
import {
  findOrderById,
  findOrdersByUserId,
  findOrdersByShopId,
  findAllOrders,
  updateOrderStatus,
  findCartWithItems,
  findAddressByIdAndUserId,
  createOrderTransaction,
} from "./order.repository.js";

/**
 * Converts the user's cart into an order.
 * Validates every item (active product, active shop, sufficient stock)
 * before running the atomic transaction.
 */
export const checkoutService = async (userId: string, addressId: string) => {
  const cart = await findCartWithItems(userId);
  if (!cart || cart.items.length === 0) throw new AppError("Cart is empty", 400);

  const address = await findAddressByIdAndUserId(addressId, userId);
  if (!address) throw new AppError("Address not found", 404);

  // Pre-flight validation — check all items before touching the DB
  for (const item of cart.items) {
    if (!item.product.isActive) throw new AppError(`Product "${item.product.name}" is no longer available`, 400);
    if (item.product.shop.status !== ShopStatus.ACTIVE) throw new AppError(`Shop for "${item.product.name}" is not active`, 400);

    const available = (item.product.inventory?.stockQuantity ?? 0) - (item.product.inventory?.reservedQuantity ?? 0);
    if (available < item.quantity) throw new AppError(`Insufficient stock for "${item.product.name}"`, 409);
  }

  const totalAmount = cart.items.reduce(
    (sum: number, item: typeof cart.items[number]) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  // Compute new stock values before entering the transaction
  const inventoryUpdates = cart.items.map((item: typeof cart.items[number]) => ({
    productId: item.product.id,
    stockQuantity: (item.product.inventory?.stockQuantity ?? 0) - item.quantity,
  }));

  const order = await createOrderTransaction({
    userId,
    addressId,
    totalAmount,
    items: cart.items.map((item: typeof cart.items[number]) => ({
      productId: item.product.id,
      shopId: item.product.shopId,
      quantity: item.quantity,
      priceAtPurchase: Number(item.product.price),
    })),
    cartId: cart.id,
    inventoryUpdates,
  });

  return { data: order };
};

export const getMyOrdersService = async (userId: string) => {
  const orders = await findOrdersByUserId(userId);
  return { data: orders };
};

export const getMyOrderByIdService = async (userId: string, orderId: string) => {
  const order = await findOrderById(orderId);
  if (!order) throw new AppError("Order not found", 404);
  if (order.userId !== userId) throw new AppError("Forbidden", 403);
  return { data: order };
};

// ─── Seller ───────────────────────────────────────────────────────────────────

export const getShopOrdersService = async (ownerId: string) => {
  const shop = await findShopByOwnerId(ownerId);
  if (!shop) throw new AppError("You don't have a shop", 404);
  const orders = await findOrdersByShopId(shop.id);
  return { data: orders };
};

/**
 * Seller can only advance orders that contain their products.
 * Allowed transitions: PENDING → CONFIRMED, CONFIRMED → SHIPPED.
 * Any other transition is rejected.
 */
export const updateShopOrderStatusService = async (ownerId: string, orderId: string, status: OrderStatus) => {
  const shop = await findShopByOwnerId(ownerId);
  if (!shop) throw new AppError("You don't have a shop", 404);

  const order = await findOrderById(orderId);
  if (!order) throw new AppError("Order not found", 404);

  // Ensure at least one item in the order belongs to this seller's shop
  const belongsToShop = order.items.some((item: { shopId: string }) => item.shopId === shop.id);
  if (!belongsToShop) throw new AppError("Forbidden", 403);

  const sellerTransitions: Partial<Record<OrderStatus, OrderStatus>> = {
    [OrderStatus.PENDING]: OrderStatus.CONFIRMED,
    [OrderStatus.CONFIRMED]: OrderStatus.SHIPPED,
  };

  if (sellerTransitions[order.status as OrderStatus] !== status) {
    throw new AppError(`Cannot transition order from ${order.status} to ${status}`, 400);
  }

  const updated = await updateOrderStatus(orderId, status);
  return { data: updated };
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAllOrdersService = async () => {
  const orders = await findAllOrders();
  return { data: orders };
};

/**
 * Admin can move orders forward freely, or cancel any non-delivered order.
 * Backwards transitions (other than CANCELLED) are blocked.
 */
export const adminUpdateOrderStatusService = async (orderId: string, status: OrderStatus) => {
  const order = await findOrderById(orderId);
  if (!order) throw new AppError("Order not found", 404);

  if (status === OrderStatus.CANCELLED) {
    // Cannot cancel an already-delivered order
    if (order.status === OrderStatus.DELIVERED) throw new AppError("Cannot cancel a delivered order", 400);
  } else {
    // Enforce forward-only progression for non-cancellation transitions
    const statusOrder: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED];
    const currentIdx = statusOrder.indexOf(order.status as OrderStatus);
    const newIdx = statusOrder.indexOf(status);
    if (newIdx <= currentIdx) throw new AppError(`Cannot transition order from ${order.status} to ${status}`, 400);
  }

  const updated = await updateOrderStatus(orderId, status);
  return { data: updated };
};
