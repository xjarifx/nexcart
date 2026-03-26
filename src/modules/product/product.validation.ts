import { z } from "zod";

export const createProductSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(2).max(200),
  description: z.string().min(10),
  price: z.number().positive(),
  brand: z.string().min(1),
  stockQuantity: z.number().int().min(0),
});

export const updateProductSchema = createProductSchema
  .omit({ stockQuantity: true })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "At least one field must be provided" });

export const updateInventorySchema = z.object({
  stockQuantity: z.number().int().min(0),
});

export const productQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  shop: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
