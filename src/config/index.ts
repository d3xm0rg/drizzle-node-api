import dotenv from "dotenv";
dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const config = {
  nodeEnv,
  isProduction,
  appUrl: process.env.APP_URL || "http://localhost:3000",
  port: process.env.PORT || 8000,
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  oauthSuccessRedirect: process.env.OAUTH_SUCCESS_REDIRECT || "/api/auth/me",
  oauthFailureRedirect: process.env.OAUTH_FAILURE_REDIRECT || "/login",
  allowedRedirectDomains: process.env.ALLOWED_REDIRECT_DOMAINS?.split(",") || [],
  smtpFrom: process.env.SMTP_FROM,
};

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL is required but was not provided");
}

if (!config.sessionSecret) {
  throw new Error("SESSION_SECRET is required but was not provided");
}

if (!config.googleClientId) {
  throw new Error("GOOGLE_CLIENT_ID is required but was not provided");
}

if (!config.googleClientSecret) {
  throw new Error("GOOGLE_CLIENT_SECRET is required but was not provided");
}

if (!config.smtpFrom) {
    throw new Error("SMTP_FROM is required but was not provided");
}

export default config;
