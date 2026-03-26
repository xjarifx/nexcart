import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { getReviews, createReview, deleteReview } from "./review.controller.js";

// Product review routes — mounted at /api/products/:productId/reviews
export const reviewRouter = Router({ mergeParams: true });
reviewRouter.get("/", getReviews);
reviewRouter.post("/", authenticate, createReview);

// Standalone review routes — mounted at /api/reviews
export const reviewDeleteRouter = Router();
reviewDeleteRouter.delete("/:id", authenticate, deleteReview);
