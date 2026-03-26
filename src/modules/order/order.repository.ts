import { OrderStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";

const orderInclude = {
  items: { include: { product: true, shop: true } },
  address: true,
  payment: true,
};

export const findOrderById = (id: string) =>
  prisma.order.findUnique({ where: { id }, include: orderInclude });

export const findOrdersByUserId = (userId: string) =>
  prisma.order.findMany({ where: { userId }, include: orderInclude, orderBy: { createdAt: "desc" } });

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

export const findAddressByIdAndUserId = (id: string, userId: string) =>
  prisma.address.findFirst({ where: { id, userId } });

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
  return prisma.$transaction(async (tx) => {
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

    for (const update of data.inventoryUpdates) {
      await tx.inventory.update({
        where: { productId: update.productId },
        data: { stockQuantity: update.stockQuantity },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: data.cartId } });

    return order;
  });
};
