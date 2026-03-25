import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { ZodError } from "zod";

import authRouter from "./modules/auth/auth.route.js";
import { swaggerSpec } from "./lib/swagger.js";
import { errorHandler } from "./middleware/errorHandler.js";

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

// swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 404
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// zod validation errors → 400
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues[0]?.message });
  }
  next(err);
});

// global error handler
app.use(errorHandler);

// ascii art is perfect
app.listen(PORT, () => {
  console.log("|==================================================|");
  console.log(`| Server running at http://localhost:${PORT}          |`);
  console.log(`| Swagger docs at http://localhost:${PORT}/api-docs   |`);
  console.log("|==================================================|");
});
