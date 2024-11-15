import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";
import cors from "cors";
import authRouter from "./routes/auth.js";
import { isAuthenticated } from "./middleware/auth.js";
import { SessionExpiredError } from "./utils/errors.js";

const app = express();

app.set("trust proxy", true); // Enable IP address forwarding
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;
app.use(cors());
// Middleware
app.use(express.json());

if (!process.env.SESSION_SECRET) {
  console.error("SESSION_SECRET is required but was not provided");
  process.exit(1);
}
// Session configuration
const PostgresqlStore = pgSession(session);
const sessionStore = new PostgresqlStore({
  conObject: {
    connectionString: process.env.DATABASE_URL,
  },
  tableName: "session",
  createTableIfMissing: true,
  pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
});

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "strict",
    },
    rolling: true, // Reset maxAge on every response
    name: "sessionId", // Custom cookie name
  }),
);

// Global error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (err instanceof SessionExpiredError) {
      return res.status(440).json({ error: "Session has expired" });
    }

    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  },
);

// Routes
app.use("/api/auth", authRouter);

// Protected route example
app.get("/api/users", async (req, res) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users);
    res.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
