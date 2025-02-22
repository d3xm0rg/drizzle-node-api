import { Request, Response, NextFunction } from "express";
import { AppError, ErrorResponse } from "../utils/errors.js";

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof AppError) {
    err.log(); // Centralized logging
    const response: ErrorResponse = {
      status: "error",
      message: err.message,
      code: err.code,
    };
    return res.status(err.statusCode).json(response);
  }

  console.error("Unhandled error:", err);
  const response: ErrorResponse = {
    status: "error",
    message: "Internal server error",
  };
  return res.status(500).json(response);
}
