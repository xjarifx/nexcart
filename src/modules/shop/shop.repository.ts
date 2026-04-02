/**
 * shop/shop.repository.ts
 *
 * Database access layer for shops.
 * Each user can own at most one shop (enforced by the unique ownerId constraint).
 */

import { ShopStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";

/** Find the shop owned by a specific user (one-to-one relationship). */
export const findShopByOwnerId = (ownerId: string) =>
  prisma.shop.findUnique({ where: { ownerId } });

/** Find a shop by its public slug, including basic owner info. */
export const findShopBySlug = (slug: string) =>
  prisma.shop.findUnique({
    where: { slug },
    include: { owner: { select: { id: true, name: true } } },
  });

export const findShopById = (id: string) =>
  prisma.shop.findUnique({ where: { id } });

/** Returns all shops, optionally filtered by status (PENDING | ACTIVE | SUSPENDED). */
export const findAllShops = (skip: number, take: number, status?: ShopStatus) =>
  prisma.shop.findMany({
    where: status ? { status } : undefined,
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });

export const countShops = (status?: ShopStatus) =>
  prisma.shop.count({ where: status ? { status } : undefined });

export const createShop = (data: {
  ownerId: string;
  name: string;
  slug: string;
  description: string;
}) => prisma.shop.create({ data });

export const updateShopById = (
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    status?: ShopStatus;
  },
) => prisma.shop.update({ where: { id }, data });
