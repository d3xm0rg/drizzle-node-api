import { Request, Response, NextFunction } from "express";
import { SessionExpiredError } from "../utils/errors.js";

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check session expiry using timestamp
  const now = Date.now();
  if (!req.session.expiresAt || now > req.session.expiresAt) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      }
    });
    throw new SessionExpiredError("Session has expired");
  }

  // Extend session if it's close to expiring (within 15 minutes)
  const fifteenMinutes = 15 * 60 * 1000;
  if (req.session.expiresAt - now < fifteenMinutes) {
    req.session.expiresAt = now + 24 * 60 * 60 * 1000; // Extend by 24 hours
  }

  next();
};
