import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request } from "express";

const userOrIpKey = (req: Request): string => {
  return req.user?.id ?? ipKeyGenerator(req.ip ?? "");
};

// Limits high-impact authenticated actions by user first, then by IP fallback.
export const sensitiveWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: userOrIpKey,
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
