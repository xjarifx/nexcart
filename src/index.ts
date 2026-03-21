import "dotenv/config";
import express from "express";
import cors from "cors";
import { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

import authRouter from "./modules/auth/auth.route.js";
import { swaggerSpec } from "./lib/swagger.js";

const app = express();
const PORT = process.env.PORT;

// enable CORS for frontend URL
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// parse incoming JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// health check route
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// auth routes
app.use("/api/auth", authRouter);

// swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// invalid route handler
app.use((req, res) => {
  res.status(404).json({ error: "Invalid route" });
});

// global error handler
app.use((err: Error, req: Request, res: Response) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log("======================================");
  console.log(`| Server is running on: http://localhost:${PORT}`);
  console.log(`| Swagger docs available at: http://localhost:${PORT}/api-docs`);
  console.log("======================================");
});
