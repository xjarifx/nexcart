import { prisma } from "../../lib/prisma.js";

export const findReviewsByProductId = (productId: string) =>
  prisma.review.findMany({
    where: { productId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

export const findReviewById = (id: string) =>
  prisma.review.findUnique({ where: { id } });

export const findReviewByUserAndProduct = (userId: string, productId: string) =>
  prisma.review.findUnique({ where: { userId_productId: { userId, productId } } });

export const createReview = (data: { userId: string; productId: string; rating: number; comment: string }) =>
  prisma.review.create({ data });

export const deleteReviewById = (id: string) =>
  prisma.review.delete({ where: { id } });
