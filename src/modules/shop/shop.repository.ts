import { ShopStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";

export const findShopByOwnerId = (ownerId: string) =>
  prisma.shop.findUnique({ where: { ownerId } });

export const findShopBySlug = (slug: string) =>
  prisma.shop.findUnique({ where: { slug }, include: { owner: { select: { id: true, name: true } } } });

export const findShopById = (id: string) =>
  prisma.shop.findUnique({ where: { id } });

export const findAllShops = (status?: ShopStatus) =>
  prisma.shop.findMany({ where: status ? { status } : undefined });

export const createShop = (data: { ownerId: string; name: string; slug: string; description: string }) =>
  prisma.shop.create({ data });

export const updateShopById = (id: string, data: { name?: string; slug?: string; description?: string; status?: ShopStatus }) =>
  prisma.shop.update({ where: { id }, data });
