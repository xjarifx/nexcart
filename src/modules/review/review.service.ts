import { AppError } from "../../types/errors.js";
import { findProductById } from "../product/product.repository.js";
import {
  findReviewsByProductId,
  findReviewById,
  findReviewByUserAndProduct,
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

  const existing = await findReviewByUserAndProduct(userId, productId);
  if (existing) throw new AppError("You have already reviewed this product", 409);

  const review = await createReview({ userId, productId, ...data });
  return { data: review };
};

export const deleteReviewService = async (userId: string, reviewId: string) => {
  const review = await findReviewById(reviewId);
  if (!review) throw new AppError("Review not found", 404);
  if (review.userId !== userId) throw new AppError("Forbidden", 403);
  await deleteReviewById(reviewId);
};
