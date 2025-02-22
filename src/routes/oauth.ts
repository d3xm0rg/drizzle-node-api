// src/routes/oauth.ts
import express from "express";
import passport from "passport";
import { setUserSession } from "../utils/session.js";
import { rateLimiter } from "../middleware/rte-limiter.js";
import { URL } from "url";

const router = express.Router();

// Validate redirect URL to prevent open redirect vulnerabilities
function isValidRedirectUrl(redirectUrl: string | undefined): boolean {
  if (!redirectUrl) {
    return false;
  }

  try {
    // For relative URLs, just check if they start with '/'
    if (redirectUrl.startsWith("/")) {
      return true;
    }

    // For absolute URLs, check against allowed domains if configured
    const allowedDomains =
      process.env.ALLOWED_REDIRECT_DOMAINS?.split(",") || [];
    if (allowedDomains.length === 0) {
      return false; // Don't allow absolute URLs if no domains are explicitly allowed
    }

    const url = new URL(redirectUrl);
    return allowedDomains.includes(url.hostname);
  } catch {
    return false; // If URL parsing fails, consider it invalid
  }
}

// Helper to get safe redirect URLs
function getRedirectUrls(req: express.Request) {
  const defaultSuccessRedirect =
    process.env.OAUTH_SUCCESS_REDIRECT || "/api/auth/me";
  const defaultFailureRedirect = process.env.OAUTH_FAILURE_REDIRECT || "/login";

  const requestedRedirect = req.query.redirect_to as string | undefined;

  return {
    successRedirect: isValidRedirectUrl(requestedRedirect)
      ? requestedRedirect
      : defaultSuccessRedirect,
    failureRedirect: defaultFailureRedirect,
  };
}

// Initiate Google OAuth flow
router.get(
  "/google",
  rateLimiter,
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { successRedirect } = getRedirectUrls(req);

    // Store the intended redirect URL in session
    (req.session as any).oauth = {
      returnTo: successRedirect,
    };
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

// Handle Google OAuth callback
router.get(
  "/google/callback",
  rateLimiter,
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { failureRedirect } = getRedirectUrls(req);

    passport.authenticate("google", {
      failureRedirect,
      failureMessage: true,
    })(req, res, next);
  },
  async (req: express.Request, res: express.Response) => {
    try {
      if (!req.user) {
        const { failureRedirect } = getRedirectUrls(req);
        return res.redirect(failureRedirect);
      }

      // Set up user session
      await setUserSession(req, (req.user as any).id, "google");

      // Get the stored redirect URL or use default
      const storedRedirect = (req.session as any).oauth?.returnTo;
      const { successRedirect } = getRedirectUrls(req);
      const redirectUrl = isValidRedirectUrl(storedRedirect)
        ? storedRedirect
        : successRedirect;

      // Clean up the stored OAuth data
      if ((req.session as any).oauth) {
        delete (req.session as any).oauth;
      }

      // Redirect to the appropriate URL
      res.redirect(redirectUrl || "/");
    } catch (error) {
      console.error("OAuth callback error:", error);
      const { failureRedirect } = getRedirectUrls(req);
      res.redirect(failureRedirect);
    }
  },
);

export default router;
