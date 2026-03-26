import "dotenv/config";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import authRouter from "./modules/auth/auth.route.js";
import { swaggerSpec } from "./lib/swagger.js";
import { globalErrorHandler } from "./middleware/errorHandler.middleware.js";
import userRouter from "./modules/users/users.route.js";

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

// routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);

// swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 404
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// global error handler (handles Zod, AppError, and all other errors)
app.use(globalErrorHandler);

// ascii art is perfect
app.listen(PORT, () => {
  console.log("|==================================================|");
  console.log(`| Server running at http://localhost:${PORT}          |`);
  console.log(`| Swagger docs at http://localhost:${PORT}/api-docs   |`);
  console.log("|==================================================|");
});
