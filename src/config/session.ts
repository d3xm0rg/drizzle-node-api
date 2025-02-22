import type { SessionOptions } from "express-session";
import pgSession from "connect-pg-simple";
import session from "express-session";

export function configureSession(): {
  store: pgSession.PGStore;
  config: SessionOptions;
} {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required but was not provided");
  }

  const PostgresqlStore = pgSession(session);
  const sessionStore = new PostgresqlStore({
    conObject: {
      connectionString: process.env.DATABASE_URL,
    },
    tableName: "session",
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
  });

  const sessionConfig: SessionOptions = {
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "strict",
    },
    rolling: true,
    name: "sessionId",
  };

  return { store: sessionStore, config: sessionConfig };
}
