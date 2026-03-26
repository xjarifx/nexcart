import { Decimal } from "@prisma/client/runtime/library";
import { ShopStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";

export const findProductsByShopId = (shopId: string) =>
  prisma.product.findMany({ where: { shopId }, include: { inventory: true, category: true } });

export const findProductById = (id: string) =>
  prisma.product.findUnique({ where: { id }, include: { inventory: true, category: true, shop: true } });

export const findProductBySlug = (slug: string) =>
  prisma.product.findUnique({ where: { slug }, include: { inventory: true, category: true, shop: true } });

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
        ...(filters.minPrice && { gte: new Decimal(filters.minPrice) }),
        ...(filters.maxPrice && { lte: new Decimal(filters.maxPrice) }),
      },
    }),
  };

  return Promise.all([
    prisma.product.findMany({ where, skip: filters.skip, take: filters.take, include: { inventory: true, category: true } }),
    prisma.product.count({ where }),
  ]);
};

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

export const softDeleteProduct = (id: string) =>
  prisma.product.update({ where: { id }, data: { isActive: false } });

export const updateInventory = (productId: string, stockQuantity: number) =>
  prisma.inventory.update({ where: { productId }, data: { stockQuantity } });
