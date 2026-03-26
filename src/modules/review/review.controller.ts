import { Request, Response, NextFunction } from "express";
import { createReviewSchema } from "./review.validation.js";
import { getReviewsService, createReviewService, deleteReviewService } from "./review.service.js";

export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getReviewsService(req.params.productId);
  res.json(result);
};

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  const body = createReviewSchema.parse(req.body);
  const result = await createReviewService(req.user!.id, req.params.productId, body);
  res.status(201).json(result);
};

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  await deleteReviewService(req.user!.id, req.params.id);
  res.status(204).send();
};
