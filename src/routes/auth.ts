import express from "express";
import * as authHandlers from "../handlers/auth.handlers.js";
import { isAuthenticated } from "../middleware/auth.js";
import { rateLimiter } from "../middleware/rte-limiter.js";

const router = express.Router();

router.post("/register", authHandlers.handleRegister);
router.post("/login", authHandlers.handleLogin);
router.post("/logout", isAuthenticated, authHandlers.handleLogout);
router.get("/me", isAuthenticated, authHandlers.handleGetProfile);

router.post(
  "/password-reset",
  rateLimiter,
  authHandlers.handlePasswordResetRequest,
);
router.post(
  "/password-reset/:token",
  rateLimiter,
  authHandlers.handlePasswordReset,
);
router.get("/sessions", isAuthenticated, authHandlers.handleGetSessions);
router.delete(
  "/sessions/:sessionId",
  isAuthenticated,
  authHandlers.handleTerminateSession,
);

export default router;
