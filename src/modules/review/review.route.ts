import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { getReviews, createReview, deleteReview } from "./review.controller.js";

// Product review routes — mounted at /api/products/:productId/reviews
export const reviewRouter = Router({ mergeParams: true });

/**
 * @openapi
 * /api/products/{productId}/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: Get all reviews for a product
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of reviews
 *       404:
 *         description: Product not found
 */
reviewRouter.get("/", getReviews);

/**
 * @openapi
 * /api/products/{productId}/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Submit a review for a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating, comment]
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review submitted
 *       404:
 *         description: Product not found
 *       409:
 *         description: You have already reviewed this product
 */
reviewRouter.post("/", authenticate, createReview);

// Standalone review routes — mounted at /api/reviews
export const reviewDeleteRouter = Router();

/**
 * @openapi
 * /api/reviews/{id}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete own review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Review deleted
 *       403:
 *         description: Review does not belong to you
 *       404:
 *         description: Review not found
 */
reviewDeleteRouter.delete("/:id", authenticate, deleteReview);
