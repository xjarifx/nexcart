import { z } from "zod";

export const createShopSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10),
});

export const updateShopSchema = createShopSchema.partial().refine(
  (d) => d.name !== undefined || d.description !== undefined,
  { message: "At least one field must be provided" },
);
