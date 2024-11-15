import { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import * as sessionUtils from "../utils/session.js";
import { AuthError, SessionError } from "../utils/errors.js";
import {
  registerSchema,
  loginSchema,
  passwordResetSchema,
  passwordResetRequestSchema,
} from "../utils/validate.js";

export async function handleRegister(req: Request, res: Response) {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const newUser = await authService.registerUser(validation.data);

    await sessionUtils.regenerateSession(req);
    sessionUtils.setUserSession(req, newUser.id, newUser.email);

    res.status(201).json(newUser);
  } catch (error) {
    handleError(error, res);
  }
}

export async function handleLogin(req: Request, res: Response) {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const user = await authService.loginUser(validation.data);

    await sessionUtils.regenerateSession(req);
    sessionUtils.setUserSession(req, user.id, user.email);

    res.json(user);
  } catch (error) {
    handleError(error, res);
  }
}

export async function handleLogout(req: Request, res: Response) {
  try {
    const sessionId = req.session.id;
    await sessionUtils.destroySession(req);

    res.clearCookie("sessionId");
    console.log(
      `Session ${sessionId} terminated at ${new Date().toISOString()}`,
    );

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    handleError(error, res);
  }
}
export async function handlePasswordResetRequest(req: Request, res: Response) {
  try {
    const validation = passwordResetRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const result = await authService.requestPasswordReset(
      validation.data.email,
    );
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
}

export async function handlePasswordReset(req: Request, res: Response) {
  try {
    const validation = passwordResetSchema.safeParse({
      token: req.params.token,
      ...req.body,
    });
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const result = await authService.resetPassword(
      validation.data.token,
      validation.data.newPassword,
    );
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
}

export async function handleGetSessions(req: Request, res: Response) {
  try {
    const sessions = await authService.getUserSessions(req.session.userId!);
    res.json(sessions);
  } catch (error) {
    handleError(error, res);
  }
}

export async function handleTerminateSession(req: Request, res: Response) {
  try {
    const result = await authService.terminateSession(
      req.session.userId!,
      req.params.sessionId,
    );
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
}

export async function handleGetProfile(req: Request, res: Response) {
  try {
    const user = await authService.getUserById(req.session.userId!);
    res.json(user);
  } catch (error) {
    handleError(error, res);
  }
}

function handleError(error: unknown, res: Response) {
  console.error("Auth error:", error);

  if (error instanceof AuthError) {
    return res.status(401).json({ error: error.message });
  }

  if (error instanceof SessionError) {
    return res.status(400).json({ error: error.message });
  }

  res.status(500).json({ error: "Internal server error" });
}
