import { Request, Response, NextFunction } from "express";
import { SessionExpiredError } from "../utils/errors.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof SessionExpiredError) {
    return res.status(440).json({ error: "Session has expired" });
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
