import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().uuid().optional(),
});

export const updateCategorySchema = createCategorySchema.partial().refine(
  (d) => d.name !== undefined || d.parentId !== undefined,
  { message: "At least one field must be provided" },
);
