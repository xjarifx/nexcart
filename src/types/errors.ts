/**
 * types/errors.ts
 *
 * Custom application error class.
 * Throw `AppError` anywhere in the service/repository layer to produce
 * a structured HTTP error response via the global errorHandler middleware.
 *
 * Usage:
 *   throw new AppError("Product not found", 404);
 *   throw new AppError("Forbidden", 403);
 */

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}
