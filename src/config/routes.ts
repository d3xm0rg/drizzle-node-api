import { Express } from "express";
import authRouter from "../routes/auth.js";
import oauthRouter from "../routes/oauth.js";

export function setupRoutes(app: Express) {
  // Authentication routes
  app.use("/api/auth", authRouter);
  app.use("/api/auth", oauthRouter);
}
