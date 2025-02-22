import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "../db/index.js";
import {
  loginAttempts,
  passwordResets,
  sessions,
  users,
} from "../db/schema.js";
import { and, eq, sql } from "drizzle-orm";
import { AuthError } from "../utils/errors.js";
import { sendPasswordResetEmail } from "../utils/email.js";

interface UserRegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface UserLoginData {
  email: string;
  password: string;
}

interface GoogleOAuthData {
  firstName: string;
  lastName: string;
  email: string;
  googleId: string;
}

export async function registerUser(userData: UserRegisterData) {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, userData.email));

  if (existingUser.length > 0) {
    throw new AuthError("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const [newUser] = await db
    .insert(users)
    .values({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
    })
    .returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    });

  return newUser;
}

export async function loginUser(credentials: UserLoginData) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, credentials.email));

  if (!user) {
    throw new AuthError("Invalid credentials");
  }

  const validPassword = await bcrypt.compare(
    credentials.password,
    user.password,
  );
  if (!validPassword) {
    throw new AuthError("Invalid credentials");
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

export async function getUserByGoogleId(googleId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.googleId, googleId));

  return user;
}

export async function findOrCreateUserFromGoogle(userData: GoogleOAuthData) {
  let user = await getUserByGoogleId(userData.googleId);

  if (!user) {
    // User doesn't exist, create a new user
    const [newUser] = await db
      .insert(users)
      .values({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        googleId: userData.googleId,
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      });
    user = newUser;
  }

  return user;
}

export async function getUserById(userId: number) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    throw new AuthError("User not found");
  }

  return user;
}

export async function requestPasswordReset(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    // Return success even if user doesn't exist to prevent email enumeration
    return {
      message:
        "If your email exists in our system, you will receive a password reset link",
    };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // Token valid for 1 hour

  // First, invalidate any existing reset tokens for this user
  await db
    .update(passwordResets)
    .set({ used: true })
    .where(eq(passwordResets.userId, user.id));

  // Then create a new reset token
  await db.insert(passwordResets).values({
    userId: user.id,
    token: await bcrypt.hash(token, 10),
    expiresAt: expires,
  });

  await sendPasswordResetEmail(user.email, token);

  return {
    message:
      "If your email exists in our system, you will receive a password reset link",
  };
}

export async function resetPassword(token: string, newPassword: string) {
  const [resetRequest] = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        sql`${passwordResets.expiresAt} > NOW()`,
        eq(passwordResets.used, false),
      ),
    );

  if (!resetRequest) {
    throw new AuthError("Invalid or expired reset token");
  }

  const tokenValid = await bcrypt.compare(token, resetRequest.token);
  if (!tokenValid) {
    throw new AuthError("Invalid or expired reset token");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, resetRequest.userId));

    await tx
      .update(passwordResets)
      .set({ used: true })
      .where(eq(passwordResets.id, resetRequest.id));

    // Invalidate all sessions for this user
    await tx.delete(sessions).where(eq(sessions.userId, resetRequest.userId));
  });

  return { message: "Password reset successful" };
}

export async function getUserSessions(userId: number) {
  const activeSessions = await db
    .select({
      id: sessions.sid,
      userAgent: sessions.userAgent,
      ipAddress: sessions.ipAddress,
      lastActivity: sessions.lastActivity,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), sql`${sessions.expire} > NOW()`));

  return activeSessions;
}

export async function terminateSession(userId: number, sessionId: string) {
  const result = await db
    .delete(sessions)
    .where(and(eq(sessions.sid, sessionId), eq(sessions.userId, userId)))
    .returning();

  if (!result.length) {
    throw new AuthError("Session not found");
  }

  return { message: "Session terminated successfully" };
}

export async function recordLoginAttempt(
  email: string,
  success: boolean,
  ipAddress: string,
) {
  await db.insert(loginAttempts).values({
    email,
    success,
    ipAddress,
    timestamp: new Date(),
  });

  if (!success) {
    const recentFailures = await db
      .select({ count: sql<number>`count(*)` })
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.email, email),
          eq(loginAttempts.success, false),
          sql`${loginAttempts.timestamp} > NOW() - INTERVAL '15 minutes'`,
        ),
      );

    if (recentFailures[0].count >= 5) {
      throw new AuthError("Too many failed attempts. Please try again later.");
    }
  }
}
