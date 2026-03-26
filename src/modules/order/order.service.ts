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

export const checkoutService = async (userId: string, addressId: string) => {
  const cart = await findCartWithItems(userId);
  if (!cart || cart.items.length === 0) throw new AppError("Cart is empty", 400);

  const address = await findAddressByIdAndUserId(addressId, userId);
  if (!address) throw new AppError("Address not found", 404);

  // Validate all items
  for (const item of cart.items) {
    if (!item.product.isActive) throw new AppError(`Product "${item.product.name}" is no longer available`, 400);
    if (item.product.shop.status !== ShopStatus.ACTIVE) throw new AppError(`Shop for "${item.product.name}" is not active`, 400);

    const available = (item.product.inventory?.stockQuantity ?? 0) - (item.product.inventory?.reservedQuantity ?? 0);
    if (available < item.quantity) throw new AppError(`Insufficient stock for "${item.product.name}"`, 409);
  }

  const totalAmount = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  const inventoryUpdates = cart.items.map((item) => ({
    productId: item.product.id,
    stockQuantity: (item.product.inventory?.stockQuantity ?? 0) - item.quantity,
  }));

  const order = await createOrderTransaction({
    userId,
    addressId,
    totalAmount,
    items: cart.items.map((item) => ({
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

export const updateShopOrderStatusService = async (ownerId: string, orderId: string, status: OrderStatus) => {
  const shop = await findShopByOwnerId(ownerId);
  if (!shop) throw new AppError("You don't have a shop", 404);

  const order = await findOrderById(orderId);
  if (!order) throw new AppError("Order not found", 404);

  const belongsToShop = order.items.some((item) => item.shopId === shop.id);
  if (!belongsToShop) throw new AppError("Forbidden", 403);

  // Sellers can only move: PENDING → CONFIRMED, CONFIRMED → SHIPPED
  const sellerTransitions: Partial<Record<OrderStatus, OrderStatus>> = {
    [OrderStatus.PENDING]: OrderStatus.CONFIRMED,
    [OrderStatus.CONFIRMED]: OrderStatus.SHIPPED,
  };

  if (sellerTransitions[order.status] !== status) {
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

export const adminUpdateOrderStatusService = async (orderId: string, status: OrderStatus) => {
  const order = await findOrderById(orderId);
  if (!order) throw new AppError("Order not found", 404);

  // Admin cannot go backwards except to CANCELLED
  if (status === OrderStatus.CANCELLED) {
    if (order.status === OrderStatus.DELIVERED) throw new AppError("Cannot cancel a delivered order", 400);
  } else {
    const statusOrder = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED];
    const currentIdx = statusOrder.indexOf(order.status);
    const newIdx = statusOrder.indexOf(status);
    if (newIdx <= currentIdx) throw new AppError(`Cannot transition order from ${order.status} to ${status}`, 400);
  }

  const updated = await updateOrderStatus(orderId, status);
  return { data: updated };
};
