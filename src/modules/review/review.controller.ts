/**
 * review/review.controller.ts
 *
 * HTTP layer for review endpoints.
 * GET is public. POST and DELETE require authentication (enforced in route file).
 */

import { Request, Response, NextFunction } from "express";
import { respond } from "../../lib/response.js";
import { parsePaginationQuery } from "../../lib/paginate.js";
import { createReviewSchema } from "./review.validation.js";
import {
  getReviewsService,
  createReviewService,
  deleteReviewService,
} from "./review.service.js";

export const getReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { page, limit } = parsePaginationQuery({
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
  });
  const result = await getReviewsService(
    req.params.productId as string,
    page,
    limit,
  );
  respond(res, { data: result.data, meta: result.meta });
};

export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const body = createReviewSchema.parse(req.body);
  const result = await createReviewService(
    req.user!.id,
    req.params.productId as string,
    body,
  );
  respond(res, { status: 201, message: "Review submitted", data: result.data });
};

export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await deleteReviewService(req.user!.id, req.params.id as string);
  respond(res, { message: "Review deleted" });
};
