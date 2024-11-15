import { Request } from "express";
import { SessionError } from "./errors.js";
import { db } from "../db/index.js";
import { sessions } from "../db/schema.js";
import { eq } from "drizzle-orm";

export async function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) reject(new SessionError("Failed to regenerate session"));
      resolve();
    });
  });
}

export async function destroySession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) reject(new SessionError("Failed to destroy session"));
      resolve();
    });
  });
}

export async function setUserSession(
  req: Request,
  userId: number,
  email: string,
) {
  req.session.userId = userId;
  req.session.email = email;
  req.session.expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  const ipAddress =
    (req.headers["x-forwarded-for"] as string) ||
    req.ip ||
    req.socket.remoteAddress ||
    null;

  // Update session record with additional tracking information
  await db
    .update(sessions)
    .set({
      userId: userId,
      userAgent: req.get("user-agent") || null,
      ipAddress: Array.isArray(ipAddress)
        ? ipAddress[0]
        : ipAddress?.split(",")[0],
      lastActivity: new Date(),
    })
    .where(eq(sessions.sid, req.session.id));
}

export async function updateSessionActivity(req: Request) {
  if (req.session.id) {
    await db
      .update(sessions)
      .set({
        lastActivity: new Date(),
      })
      .where(eq(sessions.sid, req.session.id));
  }
}
