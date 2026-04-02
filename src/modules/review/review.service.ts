/**
 * review/review.service.ts
 *
 * Business logic for product reviews.
 *
 * Constraints enforced here:
 *  - Product must exist before a review can be created or listed
 *  - One review per user per product (checked before insert; also enforced by DB unique constraint)
 *  - Only the review author can delete their own review
 *
 * NOTE: There is currently no check that the reviewer has purchased the product.
 * See AUDIT.md for this known gap.
 */

import { AppError } from "../../types/errors.js";
import { findProductById } from "../product/product.repository.js";
import {
  findReviewsByProductId,
  findReviewById,
  findReviewByUserAndProduct,
  hasDeliveredOrderForProduct,
  createReview,
  deleteReviewById,
} from "./review.repository.js";

export const getReviewsService = async (productId: string) => {
  const product = await findProductById(productId);
  if (!product) throw new AppError("Product not found", 404);
  const reviews = await findReviewsByProductId(productId);
  return { data: reviews };
};

export const createReviewService = async (
  userId: string,
  productId: string,
  data: { rating: number; comment: string },
) => {
  const product = await findProductById(productId);
  if (!product) throw new AppError("Product not found", 404);

  // Prevent duplicate reviews from the same user
  const existing = await findReviewByUserAndProduct(userId, productId);
  if (existing)
    throw new AppError("You have already reviewed this product", 409);

  const hasPurchased = await hasDeliveredOrderForProduct(userId, productId);
  if (!hasPurchased) {
    throw new AppError("You can only review products you have received", 403);
  }

  const review = await createReview({ userId, productId, ...data });
  return { data: review };
};

/** Deletes a review after verifying the requesting user is the author. */
export const deleteReviewService = async (userId: string, reviewId: string) => {
  const review = await findReviewById(reviewId);
  if (!review) throw new AppError("Review not found", 404);
  if (review.userId !== userId) throw new AppError("Forbidden", 403);
  await deleteReviewById(reviewId);
};
