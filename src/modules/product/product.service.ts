/**
 * product/product.service.ts
 *
 * Business logic for product management.
 *
 * Two access contexts:
 *  - Seller: full CRUD on their own shop's products, inventory management
 *  - Public: read-only, paginated, filtered catalog (active products only)
 *
 * Ownership is verified by matching the product's shopId against the
 * authenticated user's shop. Sellers cannot touch other shops' products.
 */

import { slugify } from "../../lib/slug.js";
import { paginate, buildMeta } from "../../lib/paginate.js";
import { AppError } from "../../types/errors.js";
import { ShopStatus } from "../../generated/prisma/enums.js";
import { findShopByOwnerId } from "../shop/shop.repository.js";
import { findCategoryById } from "../category/category.repository.js";
import {
  findProductsByShopId,
  countProductsByShopId,
  findProductById,
  findProductBySlug,
  findPublicProducts,
  createProduct,
  updateProductById,
  softDeleteProduct,
  updateInventory,
} from "./product.repository.js";

/**
 * Shared helper: resolves the seller's shop or throws 404.
 * Used by all seller-facing service functions.
 */
const getSellerShop = async (ownerId: string) => {
  const shop = await findShopByOwnerId(ownerId);
  if (!shop) throw new AppError("You don't have a shop", 404);
  return shop;
};

const ensureActiveShop = (status: ShopStatus) => {
  if (status !== ShopStatus.ACTIVE) {
    throw new AppError("Only active shops can perform this action", 403);
  }
};

export const getMyProductsService = async (
  ownerId: string,
  page: number,
  limit: number,
) => {
  const shop = await getSellerShop(ownerId);
  const { skip, take } = paginate(page, limit);
  const [products, total] = await Promise.all([
    findProductsByShopId(shop.id, skip, take),
    countProductsByShopId(shop.id),
  ]);
  return { data: products, meta: buildMeta(total, page, limit) };
};

/**
 * Creates a product under the seller's shop.
 * - Validates the category exists
 * - Generates a unique slug from the name
 * - Sets initial inventory if stockQuantity > 0
 */
export const createProductService = async (
  ownerId: string,
  data: {
    categoryId: string;
    name: string;
    description: string;
    price: number;
    brand: string;
    images?: string[];
    stockQuantity: number;
  },
) => {
  const shop = await getSellerShop(ownerId);
  ensureActiveShop(shop.status);
  const category = await findCategoryById(data.categoryId);
  if (!category) throw new AppError("Category not found", 404);

  const slug = slugify(data.name);
  const existing = await findProductBySlug(slug);
  if (existing) throw new AppError("Product name already taken", 409);

  const { stockQuantity, ...productData } = data;
  const product = await createProduct({
    shopId: shop.id,
    slug,
    ...productData,
  });

  if (stockQuantity > 0) {
    await updateInventory(product.id, stockQuantity);
  }

  return { data: product };
};

/**
 * Updates a product's details.
 * - Verifies the product belongs to the seller's shop
 * - Validates the new category if changed
 * - Regenerates and checks slug uniqueness if name changes
 */
export const updateProductService = async (
  ownerId: string,
  productId: string,
  data: {
    categoryId?: string;
    name?: string;
    description?: string;
    price?: number;
    brand?: string;
    images?: string[];
  },
) => {
  const shop = await getSellerShop(ownerId);
  ensureActiveShop(shop.status);
  const product = await findProductById(productId);
  if (!product) throw new AppError("Product not found", 404);
  if (product.shopId !== shop.id) throw new AppError("Forbidden", 403);

  if (data.categoryId) {
    const category = await findCategoryById(data.categoryId);
    if (!category) throw new AppError("Category not found", 404);
  }

  const slug = data.name ? slugify(data.name) : undefined;
  if (slug && slug !== product.slug) {
    const existing = await findProductBySlug(slug);
    if (existing) throw new AppError("Product name already taken", 409);
  }

  const updated = await updateProductById(productId, {
    ...data,
    ...(slug && { slug }),
  });
  return { data: updated };
};

/** Soft-deletes a product (sets isActive=false). Preserves order history integrity. */
export const deleteProductService = async (
  ownerId: string,
  productId: string,
) => {
  const shop = await getSellerShop(ownerId);
  ensureActiveShop(shop.status);
  const product = await findProductById(productId);
  if (!product) throw new AppError("Product not found", 404);
  if (product.shopId !== shop.id) throw new AppError("Forbidden", 403);
  await softDeleteProduct(productId);
};

export const getInventoryService = async (
  ownerId: string,
  productId: string,
) => {
  const shop = await getSellerShop(ownerId);
  ensureActiveShop(shop.status);
  const product = await findProductById(productId);
  if (!product) throw new AppError("Product not found", 404);
  if (product.shopId !== shop.id) throw new AppError("Forbidden", 403);
  return { data: product.inventory };
};

/** Overwrites the stock quantity for a product. */
export const updateInventoryService = async (
  ownerId: string,
  productId: string,
  stockQuantity: number,
) => {
  const shop = await getSellerShop(ownerId);
  const product = await findProductById(productId);
  if (!product) throw new AppError("Product not found", 404);
  if (product.shopId !== shop.id) throw new AppError("Forbidden", 403);
  const inventory = await updateInventory(productId, stockQuantity);
  return { data: inventory };
};

/** Public paginated product catalog with optional filters. */
export const getPublicProductsService = async (query: {
  search?: string;
  category?: string;
  brand?: string;
  shop?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy: "createdAt" | "price" | "name";
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
}) => {
  const { skip, take } = paginate(query.page, query.limit);
  const [products, total] = await findPublicProducts({
    search: query.search,
    categorySlug: query.category,
    brand: query.brand,
    shopSlug: query.shop,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    skip,
    take,
  });
  return { data: products, meta: buildMeta(total, query.page, query.limit) };
};

/** Public single product lookup — returns 404 for inactive products or suspended shops. */
export const getPublicProductBySlugService = async (slug: string) => {
  const product = await findProductBySlug(slug);
  if (!product || !product.isActive || product.shop.status !== "ACTIVE") {
    throw new AppError("Product not found", 404);
  }
  return { data: product };
};
