/**
 * product/product.repository.ts
 *
 * Database access layer for products and inventory.
 * Public queries filter to isActive=true and shop.status=ACTIVE.
 * Seller queries return all products for their shop regardless of status.
 */

import { ShopStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";

/** All products belonging to a shop (seller view — includes inactive). */
export const findProductsByShopId = (shopId: string) =>
  prisma.product.findMany({ where: { shopId }, include: { inventory: true, category: true } });

/** Single product by ID with full relations (used by seller and cart). */
export const findProductById = (id: string) =>
  prisma.product.findUnique({ where: { id }, include: { inventory: true, category: true, shop: true } });

/** Single product by slug with full relations (used by public detail page). */
export const findProductBySlug = (slug: string) =>
  prisma.product.findUnique({ where: { slug }, include: { inventory: true, category: true, shop: true } });

/**
 * Paginated public product listing with optional filters.
 * Returns a tuple of [products, totalCount] for pagination metadata.
 * Only active products from active shops are returned.
 */
export const findPublicProducts = (filters: {
  search?: string;
  categorySlug?: string;
  brand?: string;
  shopSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  skip: number;
  take: number;
}) => {
  const where = {
    isActive: true,
    shop: { status: ShopStatus.ACTIVE },
    ...(filters.search && { name: { contains: filters.search, mode: "insensitive" as const } }),
    ...(filters.brand && { brand: { equals: filters.brand, mode: "insensitive" as const } }),
    ...(filters.categorySlug && { category: { slug: filters.categorySlug } }),
    ...(filters.shopSlug && { shop: { slug: filters.shopSlug } }),
    ...((filters.minPrice || filters.maxPrice) && {
      price: {
        ...(filters.minPrice && { gte: filters.minPrice }),
        ...(filters.maxPrice && { lte: filters.maxPrice }),
      },
    }),
  };

  // Run count and data queries in parallel for performance
  return Promise.all([
    prisma.product.findMany({ where, skip: filters.skip, take: filters.take, include: { inventory: true, category: true } }),
    prisma.product.count({ where }),
  ]);
};

/**
 * Creates a product and its inventory record in a single Prisma nested write.
 * Inventory starts at stockQuantity=0; use updateInventory to set initial stock.
 */
export const createProduct = (data: {
  shopId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  brand: string;
}) =>
  prisma.product.create({
    data: {
      ...data,
      inventory: { create: { stockQuantity: 0, reservedQuantity: 0 } },
    },
    include: { inventory: true },
  });

export const updateProductById = (id: string, data: {
  categoryId?: string;
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  brand?: string;
}) => prisma.product.update({ where: { id }, data, include: { inventory: true } });

/** Soft-delete: sets isActive=false instead of removing the row. Preserves order history. */
export const softDeleteProduct = (id: string) =>
  prisma.product.update({ where: { id }, data: { isActive: false } });

/** Overwrites the stock quantity. Called by the seller inventory endpoint. */
export const updateInventory = (productId: string, stockQuantity: number) =>
  prisma.inventory.update({ where: { productId }, data: { stockQuantity } });
