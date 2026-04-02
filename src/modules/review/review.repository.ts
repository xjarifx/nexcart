/**
 * review/review.repository.ts
 *
 * Database access layer for product reviews.
 * The unique constraint on (userId, productId) is enforced at the DB level.
 */

import { prisma } from "../../lib/prisma.js";
import { OrderStatus } from "../../generated/prisma/enums.js";

/** Returns all reviews for a product, newest first, with reviewer name included. */
export const findReviewsByProductId = (
  productId: string,
  skip: number,
  take: number,
) =>
  prisma.review.findMany({
    where: { productId },
    skip,
    take,
    include: { user: { select: { id: true, name: true } } }, // only expose id and name, not email/password
    orderBy: { createdAt: "desc" },
  });

export const countReviewsByProductId = (productId: string) =>
  prisma.review.count({ where: { productId } });

export const findReviewById = (id: string) =>
  prisma.review.findUnique({ where: { id } });

/** Looks up a review by the composite unique key (userId + productId). Used to prevent duplicate reviews. */
export const findReviewByUserAndProduct = (userId: string, productId: string) =>
  prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
  });

export const createReview = (data: {
  userId: string;
  productId: string;
  rating: number;
  comment: string;
}) => prisma.review.create({ data });

export const hasDeliveredOrderForProduct = (
  userId: string,
  productId: string,
) =>
  prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId,
        status: OrderStatus.DELIVERED,
      },
    },
    select: { id: true },
  });

export const deleteReviewById = (id: string) =>
  prisma.review.delete({ where: { id } });
