/**
 * review/review.validation.ts
 *
 * Zod schemas for review request bodies.
 */

import { z } from "zod";

/** POST /api/products/:productId/reviews */
export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5), // 1–5 star rating
  comment: z.string().min(1).max(1000),
});
