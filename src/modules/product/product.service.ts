import { slugify } from "../../lib/slug.js";
import { paginate, buildMeta } from "../../lib/paginate.js";
import { AppError } from "../../types/errors.js";
import { findShopByOwnerId } from "../shop/shop.repository.js";
import { findCategoryById } from "../category/category.repository.js";
import {
  findProductsByShopId,
  findProductById,
  findProductBySlug,
  findPublicProducts,
  createProduct,
  updateProductById,
  softDeleteProduct,
  updateInventory,
} from "./product.repository.js";

const getSellerShop = async (ownerId: string) => {
  const shop = await findShopByOwnerId(ownerId);
  if (!shop) throw new AppError("You don't have a shop", 404);
  return shop;
};

export const getMyProductsService = async (ownerId: string) => {
  const shop = await getSellerShop(ownerId);
  const products = await findProductsByShopId(shop.id);
  return { data: products };
};

export const createProductService = async (
  ownerId: string,
  data: { categoryId: string; name: string; description: string; price: number; brand: string; stockQuantity: number },
) => {
  const shop = await getSellerShop(ownerId);
  const category = await findCategoryById(data.categoryId);
  if (!category) throw new AppError("Category not found", 404);

  const slug = slugify(data.name);
  const existing = await findProductBySlug(slug);
  if (existing) throw new AppError("Product name already taken", 409);

  const { stockQuantity, ...productData } = data;
  const product = await createProduct({ shopId: shop.id, slug, ...productData });

  if (stockQuantity > 0) {
    await updateInventory(product.id, stockQuantity);
  }

  return { data: product };
};

export const updateProductService = async (
  ownerId: string,
  productId: string,
  data: { categoryId?: string; name?: string; description?: string; price?: number; brand?: string },
) => {
  const shop = await getSellerShop(ownerId);
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

  const updated = await updateProductById(productId, { ...data, ...(slug && { slug }) });
  return { data: updated };
};

export const deleteProductService = async (ownerId: string, productId: string) => {
  const shop = await getSellerShop(ownerId);
  const product = await findProductById(productId);
  if (!product) throw new AppError("Product not found", 404);
  if (product.shopId !== shop.id) throw new AppError("Forbidden", 403);
  await softDeleteProduct(productId);
};

export const getInventoryService = async (ownerId: string, productId: string) => {
  const shop = await getSellerShop(ownerId);
  const product = await findProductById(productId);
  if (!product) throw new AppError("Product not found", 404);
  if (product.shopId !== shop.id) throw new AppError("Forbidden", 403);
  return { data: product.inventory };
};

export const updateInventoryService = async (ownerId: string, productId: string, stockQuantity: number) => {
  const shop = await getSellerShop(ownerId);
  const product = await findProductById(productId);
  if (!product) throw new AppError("Product not found", 404);
  if (product.shopId !== shop.id) throw new AppError("Forbidden", 403);
  const inventory = await updateInventory(productId, stockQuantity);
  return { data: inventory };
};

export const getPublicProductsService = async (query: {
  search?: string;
  category?: string;
  brand?: string;
  shop?: string;
  minPrice?: number;
  maxPrice?: number;
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
    skip,
    take,
  });
  return { data: products, meta: buildMeta(total, query.page, query.limit) };
};

export const getPublicProductBySlugService = async (slug: string) => {
  const product = await findProductBySlug(slug);
  if (!product || !product.isActive || product.shop.status !== "ACTIVE") {
    throw new AppError("Product not found", 404);
  }
  return { data: product };
};
