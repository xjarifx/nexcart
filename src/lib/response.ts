import { Response } from "express";

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  error: string | null;
  meta: Record<string, unknown>;
}

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
