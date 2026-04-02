/**
 * app.ts
 *
 * Express application setup.
 * Registers all global middleware and mounts all route modules.
 * Exported for use in index.ts (server start) and tests (supertest).
 *
 * Middleware order matters:
 *  1. helmet      — security headers
 *  2. cors        — cross-origin policy
 *  3. pino-http   — request/response logging
 *  4. json/urlencoded — body parsing
 *  5. rate limiters — applied per route group before the routers
 *  6. routers     — feature modules
 *  7. 404 handler — catches unmatched routes
 *  8. errorHandler — must be last
 */

import express from "express";
import { randomUUID } from "crypto";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";

import authRouter from "./modules/auth/auth.route.js";
import userRouter, { adminUserRouter } from "./modules/users/users.route.js";
import categoryRouter from "./modules/category/category.route.js";
import shopRouter, { adminShopRouter } from "./modules/shop/shop.route.js";
import {
  productRouter,
  sellerProductRouter,
} from "./modules/product/product.route.js";
import cartRouter from "./modules/cart/cart.route.js";
import {
  orderRouter,
  sellerOrderRouter,
  adminOrderRouter,
} from "./modules/order/order.route.js";
import paymentRouter from "./modules/payment/payment.route.js";
import {
  reviewRouter,
  reviewDeleteRouter,
} from "./modules/review/review.route.js";
import { swaggerSpec } from "./lib/swagger.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import logger from "./lib/logger.js";
import { config } from "./config.js";
import { prisma } from "./lib/prisma.js";

const httpLogger = (pinoHttp as unknown as typeof pinoHttp.default)({
  logger,
  genReqId(req, res) {
    const requestId = req.headers["x-request-id"];
    const id =
      typeof requestId === "string" && requestId.length > 0
        ? requestId
        : randomUUID();
    res.setHeader("X-Request-Id", id);
    return id;
  },
});

const app = express();
app.set("trust proxy", 1);

// ─── Security & Logging ───────────────────────────────────────────────────────

app.use(helmet()); // sets X-Frame-Options, CSP, HSTS, and 8 other headers
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (config.FRONTEND_URL.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-Request-Id"],
  }),
);
app.use(httpLogger); // logs every request with method, path, status, responseTime

// ─── Body Parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

const uuidParamNames = ["id", "orderId", "productId", "addressId"];
for (const paramName of uuidParamNames) {
  app.param(paramName, (req, res, next, value) => {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      );
    if (!isUuid) {
      return res.status(400).json({
        success: false,
        message: "",
        data: null,
        error: `Invalid ${paramName} format`,
        meta: {},
      });
    }
    return next();
  });
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────

// Tight limit on auth routes to slow down brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window per IP
  message: {
    success: false,
    message: "",
    data: null,
    error: "Too many requests, please try again later.",
    meta: {},
  },
  standardHeaders: true, // sends RateLimit-* headers
  legacyHeaders: false,
});

// Looser limit for the rest of the API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window per IP
  message: {
    success: false,
    message: "",
    data: null,
    error: "Too many requests, please try again later.",
    meta: {},
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth limiter must be registered before the auth router
app.use("/api/auth", authLimiter);
app.use("/api/v1/auth", authLimiter);
app.use("/api", apiLimiter);
app.use("/api/v1", apiLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      success: true,
      message: "OK",
      data: { database: "up" },
      error: null,
      meta: {},
    });
  } catch {
    return res.status(503).json({
      success: false,
      message: "",
      data: { database: "down" },
      error: "Database unavailable",
      meta: {},
    });
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// NOTE: /api/shops/mine/* must be registered before /api/shops/:slug
// to prevent Express from treating "mine" as a slug parameter.
const apiRouter = express.Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/shops/mine/products", sellerProductRouter);
apiRouter.use("/shops/mine/orders", sellerOrderRouter);
apiRouter.use("/shops", shopRouter);
apiRouter.use("/products/:productId/reviews", reviewRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/reviews", reviewDeleteRouter);
apiRouter.use("/cart", cartRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/admin/users", adminUserRouter);
apiRouter.use("/admin/shops", adminShopRouter);
apiRouter.use("/admin/orders", adminOrderRouter);

app.use("/api", apiRouter);
app.use("/api/v1", apiRouter);

// ─── Docs ─────────────────────────────────────────────────────────────────────

if (config.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// ─── Fallback & Error Handling ────────────────────────────────────────────────

app.use((_req, res) =>
  res.status(404).json({
    success: false,
    message: "",
    data: null,
    error: "Route not found",
    meta: {},
  }),
);

app.use(errorHandler); // must be last — catches all errors forwarded via next(err)

export default app;
