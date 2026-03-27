/**
 * lib/response.ts
 *
 * Centralised API response helper.
 * All endpoints must use `respond()` to ensure a consistent response envelope:
 *
 * {
 *   success: boolean,   // true if status < 400
 *   message: string,    // human-readable message (optional)
 *   data: T | null,     // response payload
 *   error: null,        // always null on success (errors use errorHandler)
 *   meta: {}            // pagination or other metadata
 * }
 */

import { Response } from "express";

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  error: string | null;
  meta: Record<string, unknown>;
}

/**
 * Sends a JSON response using the standard API envelope.
 * @param res     - Express Response object
 * @param options - status (default 200), message, data payload, meta object
 */
export const respond = <T>(
  res: Response,
  options: {
    status?: number;
    message?: string;
    data?: T;
    meta?: Record<string, unknown>;
  } = {},
) => {
  const { status = 200, message = "", data = null, meta = {} } = options;
  const body: ApiResponse<T> = {
    success: status < 400,
    message,
    data: data ?? null,
    error: null,
    meta,
  };
  return res.status(status).json(body);
};
