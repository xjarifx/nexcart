/**
 * category/category.validation.ts
 *
 * Zod schemas for category request bodies.
 */

import { z } from "zod";

/** POST /api/categories */
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().uuid().optional(), // omit for top-level categories
});

/** PUT /api/categories/:id — at least one field required */
export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((d) => d.name !== undefined || d.parentId !== undefined, {
    message: "At least one field must be provided",
  });
