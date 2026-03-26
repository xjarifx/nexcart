import "dotenv/config";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import authRouter from "./modules/auth/auth.route.js";
import userRouter from "./modules/users/users.route.js";
import categoryRouter from "./modules/category/category.route.js";
import shopRouter, { adminShopRouter } from "./modules/shop/shop.route.js";
import { productRouter, sellerProductRouter } from "./modules/product/product.route.js";
import cartRouter from "./modules/cart/cart.route.js";
import { orderRouter, sellerOrderRouter, adminOrderRouter } from "./modules/order/order.route.js";
import paymentRouter from "./modules/payment/payment.route.js";
import { reviewRouter, reviewDeleteRouter } from "./modules/review/review.route.js";
import { swaggerSpec } from "./lib/swagger.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";

const app = express();
const PORT = process.env.PORT;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// health check
app.get("/health", (_req, res) => res.json({ status: "OK" }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/categories", categoryRouter);
// seller sub-routes MUST come before /api/shops to prevent /:slug swallowing "mine"
app.use("/api/shops/mine/products", sellerProductRouter);
app.use("/api/shops/mine/orders", sellerOrderRouter);
app.use("/api/shops", shopRouter);
// product reviews MUST come before /api/products to prevent /:slug swallowing /:productId/reviews
app.use("/api/products/:productId/reviews", reviewRouter);
app.use("/api/products", productRouter);
app.use("/api/reviews", reviewDeleteRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/admin/shops", adminShopRouter);
app.use("/api/admin/orders", adminOrderRouter);

// swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 404
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log("|==================================================|");
  console.log(`| Server running at http://localhost:${PORT}          |`);
  console.log(`| Swagger docs at http://localhost:${PORT}/api-docs   |`);
  console.log("|==================================================|");
});
