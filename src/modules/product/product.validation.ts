/**
 * product/product.validation.ts
 *
 * Zod schemas for product and inventory request bodies and query params.
 */

import { z } from "zod";

/** POST /api/shops/mine/products */
export const createProductSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(2).max(200),
  description: z.string().min(10),
  price: z.number().positive(),
  brand: z.string().min(1),
  stockQuantity: z.number().int().min(0), // initial stock set at creation
});

/** PUT /api/shops/mine/products/:id — stockQuantity excluded (use inventory endpoint) */
export const updateProductSchema = createProductSchema
  .omit({ stockQuantity: true })
  .partial()
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

/** PUT /api/shops/mine/products/:id/inventory */
export const updateInventorySchema = z.object({
  stockQuantity: z.number().int().min(0),
});

/** GET /api/products — query string filters and pagination */
export const productQuerySchema = z.object({
  search: z.string().optional(), // name contains (case-insensitive)
  category: z.string().optional(), // category slug
  brand: z.string().optional(), // brand name (case-insensitive)
  shop: z.string().optional(), // shop slug
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sortBy: z.enum(["createdAt", "price", "name"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
