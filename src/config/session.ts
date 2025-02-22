import type { SessionOptions } from "express-session";
import pgSession from "connect-pg-simple";
import session from "express-session";
import config from "./index.js";

export function configureSession(): {
  store: pgSession.PGStore;
  config: SessionOptions;
} {
  const PostgresqlStore = pgSession(session);
  const sessionStore = new PostgresqlStore({
    conObject: {
      connectionString: config.databaseUrl,
    },
    tableName: "session",
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
  });

  const sessionConfig: SessionOptions = {
    store: sessionStore,
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.isProduction,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "strict",
    },
    rolling: true,
    name: "sessionId",
  };

  return { store: sessionStore, config: sessionConfig };
}
