import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import cors from "cors";
import passport from "../config/passport.js";

export function createApp() {
  const app = express();

  // Basic middleware setup
  app.set("trust proxy", true);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    }),
  );

  return app;
}
