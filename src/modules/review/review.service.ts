/**
 * review/review.service.ts
 *
 * Business logic for product reviews.
 *
 * Constraints enforced here:
 *  - Product must exist before a review can be created or listed
 *  - One review per user per product (checked before insert; also enforced by DB unique constraint)
 *  - Product rating aggregates are updated after create/delete
 *  - Only the review author can delete their own review
 */

import { AppError } from "../../types/errors.js";
import { paginate, buildMeta } from "../../lib/paginate.js";
import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { findProductById } from "../product/product.repository.js";
import {
  findReviewsByProductId,
  countReviewsByProductId,
  findReviewById,
  findReviewByUserAndProduct,
  hasDeliveredOrderForProduct,
} from "./review.repository.js";

const refreshProductRatingStats = async (
  tx: Prisma.TransactionClient,
  productId: string,
) => {
  const [aggregate] = await Promise.all([
    tx.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  await tx.product.update({
    where: { id: productId },
    data: {
      averageRating: aggregate._avg.rating ?? 0,
      reviewCount: aggregate._count._all,
    },
  });
};

export const getReviewsService = async (
  productId: string,
  page: number,
  limit: number,
) => {
  const product = await findProductById(productId);
  if (!product) throw new AppError("Product not found", 404);
  const { skip, take } = paginate(page, limit);
  const [reviews, total] = await Promise.all([
    findReviewsByProductId(productId, skip, take),
    countReviewsByProductId(productId),
  ]);
  return { data: reviews, meta: buildMeta(total, page, limit) };
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

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: { userId, productId, ...data },
    });
    await refreshProductRatingStats(tx, productId);
    return created;
  });
  return { data: review };
};

/** Deletes a review after verifying the requesting user is the author. */
export const deleteReviewService = async (userId: string, reviewId: string) => {
  const review = await findReviewById(reviewId);
  if (!review) throw new AppError("Review not found", 404);
  if (review.userId !== userId) throw new AppError("Forbidden", 403);
  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: reviewId } });
    await refreshProductRatingStats(tx, review.productId);
  });
};
